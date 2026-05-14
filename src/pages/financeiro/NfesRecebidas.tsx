import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, RefreshCw, FileText, Loader2, FileDown, Stethoscope } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/contexts/EmpresaContext";
import PaginationControls, { paginate } from "@/components/PaginationControls";
import { toast } from "sonner";

interface Nfe {
  id: string;
  chave: string;
  numero: string | null;
  serie: string | null;
  emitente_cnpj: string | null;
  emitente_nome: string | null;
  valor_total: number | null;
  data_emissao: string | null;
  data_recebimento: string | null;
  ambiente: string | null;
  status: string | null;
  xml_url: string | null;
}

const formatDateTime = (s: string | null) => {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};
const formatBRL = (v: number | null) =>
  (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const formatCnpj = (c: string | null) => {
  const d = (c || "").replace(/\D+/g, "");
  if (d.length !== 14) return c || "—";
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`;
};

export default function NfesRecebidas() {
  const { empresa } = useEmpresa();
  const [rows, setRows] = useState<Nfe[]>([]);
  const [loading, setLoading] = useState(false);
  const [importando, setImportando] = useState(false);
  const [busca, setBusca] = useState("");
  const [dataIni, setDataIni] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [diagOpen, setDiagOpen] = useState(false);
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagData, setDiagData] = useState<any>(null);

  const diagnosticar = async () => {
    if (!empresa.id) return toast.error("Empresa não cadastrada");
    setDiagOpen(true); setDiagLoading(true); setDiagData(null);
    try {
      const { data, error } = await supabase.functions.invoke("buscar-nfes-focus", { body: { empresaId: empresa.id } });
      if (error) throw error;
      setDiagData(data);
    } catch (e: any) {
      setDiagData({ ok: false, error: e.message });
    } finally {
      setDiagLoading(false);
    }
  };

  const load = async () => {
    setLoading(true);
    const q = (supabase as any).from("nfes_recebidas").select("*").order("data_emissao", { ascending: false });
    const { data, error } = await q;
    if (error) toast.error("Erro ao carregar NFes");
    else setRows((data as Nfe[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const importar = async () => {
    if (!empresa.id) return toast.error("Empresa não cadastrada");
    setImportando(true);
    try {
      const { data, error } = await supabase.functions.invoke("importar-nfes-focus", {
        body: { empresaId: empresa.id, baixarXml: true },
      });
      if (error) throw error;
      const r: any = data;
      if (!r?.ok) throw new Error(r?.error || "Falha na importação");
      toast.success(`Importação concluída: ${r.total} NFe(s) — ${r.inseridas} novas, ${r.atualizadas} atualizadas, ${r.comXml} com XML`);
      await load();
    } catch (e: any) {
      toast.error(e.message || "Erro ao importar NFes");
    } finally {
      setImportando(false);
    }
  };

  const baixarXml = async (n: Nfe) => {
    if (!n.xml_url) return toast.error("XML não disponível");
    try {
      const { data, error } = await supabase.functions.invoke("nfe-xml-url", { body: { path: n.xml_url } });
      if (error) throw error;
      const r: any = data;
      if (!r?.ok) throw new Error(r?.error || "Falha");
      const resp = await fetch(r.url);
      const blob = await resp.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${n.chave}.xml`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(a.href);
    } catch (e: any) {
      toast.error(e.message || "Erro ao baixar XML");
    }
  };

  const baixarDanfe = async (n: Nfe) => {
    if (!empresa.id) return toast.error("Empresa não cadastrada");
    try {
      const { data, error } = await supabase.functions.invoke("nfe-danfe-focus", {
        body: { empresaId: empresa.id, chave: n.chave },
      });
      if (error) throw error;
      const r: any = data;
      if (!r?.ok) throw new Error(r?.error || "Falha");
      const bin = atob(r.pdfBase64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const blob = new Blob([bytes], { type: "application/pdf" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `DANFE-${n.chave}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(a.href);
    } catch (e: any) {
      toast.error(e.message || "Erro ao baixar DANFE");
    }
  };

  const filtrados = useMemo(() => rows.filter(r => {
    if (busca) {
      const q = busca.toLowerCase();
      const hay = `${r.chave} ${r.numero ?? ""} ${r.emitente_nome ?? ""} ${r.emitente_cnpj ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (dataIni && r.data_emissao && r.data_emissao.slice(0, 10) < dataIni) return false;
    if (dataFim && r.data_emissao && r.data_emissao.slice(0, 10) > dataFim) return false;
    return true;
  }), [rows, busca, dataIni, dataFim]);

  useEffect(() => { setPage(1); }, [busca, dataIni, dataFim, pageSize]);

  const { paginated } = paginate(filtrados, page, pageSize);
  const totalValor = useMemo(() => filtrados.reduce((s, r) => s + (Number(r.valor_total) || 0), 0), [filtrados]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-serif font-semibold">NFes Recebidas</h1>
        <Button onClick={importar} disabled={importando || !empresa.id}>
          {importando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Importar da SEFAZ
        </Button>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">
            {filtrados.length} nota(s) — Total: {formatBRL(totalValor)}
            {empresa.nfeAmbiente && (
              <Badge variant="outline" className="ml-2">{empresa.nfeAmbiente}</Badge>
            )}
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Input placeholder="Buscar (chave, nº, emitente)" value={busca} onChange={e => setBusca(e.target.value)} className="w-72" />
            <Input type="date" value={dataIni} onChange={e => setDataIni(e.target.value)} className="w-40" />
            <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="w-40" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Emissão</TableHead>
                <TableHead>Nº/Série</TableHead>
                <TableHead>Emitente</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Chave</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Carregando…</TableCell></TableRow>
              ) : paginated.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Nenhuma NFe encontrada. Clique em <b>Importar da SEFAZ</b> para buscar via Focus NFe.
                </TableCell></TableRow>
              ) : paginated.map(n => (
                <TableRow key={n.id}>
                  <TableCell>{formatDateTime(n.data_emissao)}</TableCell>
                  <TableCell>{n.numero || "—"}{n.serie ? `/${n.serie}` : ""}</TableCell>
                  <TableCell className="max-w-xs truncate" title={n.emitente_nome || ""}>{n.emitente_nome || "—"}</TableCell>
                  <TableCell>{formatCnpj(n.emitente_cnpj)}</TableCell>
                  <TableCell className="font-mono text-xs">{n.chave}</TableCell>
                  <TableCell className="text-right">{formatBRL(n.valor_total)}</TableCell>
                  <TableCell>{n.status ? <Badge variant="secondary">{n.status}</Badge> : "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" disabled={!n.xml_url} onClick={() => baixarXml(n)} title="Baixar XML">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => baixarDanfe(n)} title="Baixar DANFE (PDF)">
                      <FileDown className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" disabled title="Vincular ao Pedido de Compra (em breve)">
                      <FileText className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PaginationControls currentPage={page} pageSize={pageSize} totalItems={filtrados.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
        </CardContent>
      </Card>
    </div>
  );
}
