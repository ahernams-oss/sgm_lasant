import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import PaginationControls from "@/components/PaginationControls";

interface PedidoItem {
  itemId?: string;
  descricao?: string;
  quantidade?: number;
  precoUnitario?: number;
  valorTotal?: number;
  unidadeMedida?: string;
}

interface PedidoRow {
  numero: number;
  data_criacao: string | null;
  created_at: string;
  fornecedor_nome: string | null;
  itens: PedidoItem[] | null;
  status: string;
}

interface Material {
  id: string;
  codigo: string;
  descricao: string;
  unidade_medida: string | null;
}

interface CompraHist {
  data: string;
  preco: number;
  quantidade: number;
  fornecedor: string;
  pedido: number;
  rawDate: number;
}

interface LinhaBanco {
  itemId: string;
  codigo: string;
  descricao: string;
  unidade: string;
  ultimas: CompraHist[];
  media: number;
  ultimoPreco: number;
}

const STATUS_VALIDOS = ["Comprado", "Entregue", "Entregue Parcial", "Emitido"];

const formatMoney = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("pt-BR");
};

export default function BancoPrecos() {
  const [pedidos, setPedidos] = useState<PedidoRow[]>([]);
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [reqItemToMaterial, setReqItemToMaterial] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [p, m, r] = await Promise.all([
        supabase
          .from("pedidos_compra")
          .select("numero, data_criacao, created_at, fornecedor_nome, itens, status")
          .in("status", STATUS_VALIDOS)
          .order("created_at", { ascending: false })
          .limit(1000),
        supabase.from("materiais_servicos").select("id, codigo, descricao, unidade_medida"),
        supabase.from("requisicoes_compras").select("itens").limit(2000),
      ]);
      setPedidos((p.data as any) || []);
      setMateriais((m.data as any) || []);
      const map = new Map<string, string>();
      ((r.data as any[]) || []).forEach((rc) => {
        const itens = Array.isArray(rc.itens) ? rc.itens : [];
        itens.forEach((it: any) => {
          if (it?.id && it?.materialId) map.set(String(it.id), String(it.materialId));
        });
      });
      setReqItemToMaterial(map);
      setLoading(false);
    })();
  }, []);

  const matById = useMemo(() => {
    const map = new Map<string, Material>();
    materiais.forEach((m) => map.set(m.id, m));
    return map;
  }, [materiais]);

  const matByDesc = useMemo(() => {
    const map = new Map<string, Material>();
    materiais.forEach((m) => map.set(m.descricao.toUpperCase().trim(), m));
    return map;
  }, [materiais]);

  const linhas = useMemo<LinhaBanco[]>(() => {
    const agrup = new Map<string, CompraHist[]>();

    for (const ped of pedidos) {
      const itens = Array.isArray(ped.itens) ? ped.itens : [];
      const dataISO = ped.created_at;
      const ts = new Date(dataISO).getTime();
      for (const it of itens) {
        const desc = (it.descricao || "").toUpperCase().trim();
        let materialId = reqItemToMaterial.get(String(it.itemId || "")) || "";
        if (!materialId && desc) {
          const m = matByDesc.get(desc);
          if (m) materialId = m.id;
        }
        const key = materialId || (desc ? `desc:${desc}` : "");
        if (!key) continue;
        const preco = Number(it.precoUnitario) || 0;
        if (preco <= 0) continue;
        const arr = agrup.get(key) || [];
        arr.push({
          data: dataISO,
          preco,
          quantidade: Number(it.quantidade) || 0,
          fornecedor: ped.fornecedor_nome || "-",
          pedido: ped.numero,
          rawDate: ts,
        });
        agrup.set(key, arr);
      }
    }

    const out: LinhaBanco[] = [];
    agrup.forEach((compras, key) => {
      compras.sort((a, b) => b.rawDate - a.rawDate);
      const ultimas = compras.slice(0, 10);
      const media = ultimas.reduce((s, c) => s + c.preco, 0) / ultimas.length;

      let codigo = "-";
      let descricao = "";
      let unidade = "";
      if (key.startsWith("desc:")) {
        descricao = key.slice(5);
      } else {
        const mat = matById.get(key);
        if (mat) {
          codigo = mat.codigo;
          descricao = mat.descricao;
          unidade = mat.unidade_medida || "";
        } else {
          descricao = compras[0] ? "(material removido)" : key;
        }
      }
      out.push({
        itemId: key,
        codigo,
        descricao,
        unidade,
        ultimas,
        media,
        ultimoPreco: ultimas[0].preco,
      });
    });

    return out.sort((a, b) => a.descricao.localeCompare(b.descricao));
  }, [pedidos, matById, matByDesc, reqItemToMaterial]);

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return linhas;
    return linhas.filter(
      (l) => l.descricao.toLowerCase().includes(q) || l.codigo.toLowerCase().includes(q),
    );
  }, [linhas, busca]);

  const totalPages = Math.max(1, Math.ceil(filtradas.length / pageSize));
  const pageData = filtradas.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [busca, pageSize]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-semibold">Banco de Preços</h1>
        <p className="text-muted-foreground">
          Histórico de preços de compra por material/serviço, com média das últimas 10 aquisições.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtro</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Buscar por código ou descrição..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="max-w-md"
          />
          <div className="mt-2 text-sm text-muted-foreground">
            {loading ? "Carregando..." : `${filtradas.length} item(ns)`}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Código</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-20">UN</TableHead>
                <TableHead>Últimas 10 compras (data / preço)</TableHead>
                <TableHead className="w-32 text-right">Último preço</TableHead>
                <TableHead className="w-32 text-right">Preço médio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageData.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhuma compra encontrada.
                  </TableCell>
                </TableRow>
              )}
              {pageData.map((l) => (
                <TableRow key={l.itemId}>
                  <TableCell className="font-mono text-xs">{l.codigo}</TableCell>
                  <TableCell className="font-medium">{l.descricao}</TableCell>
                  <TableCell>{l.unidade}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {l.ultimas.map((c, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="font-normal"
                          title={`Pedido #${c.pedido} — ${c.fornecedor} — Qtd: ${c.quantidade}`}
                        >
                          {formatDate(c.data)} · {formatMoney(c.preco)}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatMoney(l.ultimoPreco)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-primary">
                    {formatMoney(l.media)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {filtradas.length > 0 && (
        <PaginationControls
          currentPage={page}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          totalItems={filtradas.length}
        />
      )}
    </div>
  );
}
