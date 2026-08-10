import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, RefreshCw } from "lucide-react";
import { useEffect, useRef } from "react";
import SetorCombobox from "./SetorCombobox";

export type TipoMemoria = "area" | "mao_de_obra" | "unidade";

export interface LinhaMemoria {
  id: string;
  item: string;
  codigo: string;
  descricao: string;
  setor: string;
  funcionario?: string;
  quantidade?: number;
  comprimento?: number;
  largura?: number;
  hrDia?: number;
  dias?: number;
}

export interface GrupoMemoria {
  id: string;
  item: string;
  titulo: string;
  tipo: TipoMemoria;
  linhas: LinhaMemoria[];
}

export const calcLinha = (tipo: TipoMemoria, l: LinhaMemoria): number => {
  if (tipo === "area") return (l.quantidade || 0) * (l.comprimento || 0) * (l.largura || 0);
  if (tipo === "mao_de_obra") return (l.hrDia || 0) * (l.dias || 0);
  return l.quantidade || 0;
};

export const calcGrupo = (g: GrupoMemoria): number =>
  g.linhas.reduce((s, l) => s + calcLinha(g.tipo, l), 0);

const UNIDADE_LABEL: Record<TipoMemoria, string> = {
  area: "ÁREA (m²)",
  mao_de_obra: "HORA TOTAL",
  unidade: "UNIDADE",
};

const nf = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export interface ItemOrigem {
  codigo: string;
  descricao: string;
  quantidade: number;
  familia?: string;
}

interface Props {
  grupos: GrupoMemoria[];
  onChange: (g: GrupoMemoria[]) => void;
  readOnly?: boolean;
  itensOrigem?: ItemOrigem[];
  setores?: string[];
}

const SEM_FAMILIA = "SEM FAMÍLIA";

export default function MemoriaCalculoTab({ grupos, onChange, readOnly, itensOrigem = [], setores = [] }: Props) {
  const sincronizar = (atuais: GrupoMemoria[]): GrupoMemoria[] => {
    const familias: string[] = [];
    const porFamilia = new Map<string, ItemOrigem[]>();
    itensOrigem.forEach(i => {
      const f = (i.familia || "").trim() || SEM_FAMILIA;
      if (!porFamilia.has(f)) { porFamilia.set(f, []); familias.push(f); }
      porFamilia.get(f)!.push(i);
    });

    return familias.map((f, idx) => {
      const existente = atuais.find(g => g.titulo.trim().toUpperCase() === f.toUpperCase());
      const tipo: TipoMemoria = existente?.tipo || "unidade";
      const linhas: LinhaMemoria[] = porFamilia.get(f)!.map((i, li) => {
        const antiga = existente?.linhas.find(l => l.codigo === i.codigo);
        return {
          id: antiga?.id || crypto.randomUUID(),
          item: antiga?.item || `${idx + 1}.${li + 1}`,
          codigo: i.codigo,
          descricao: i.descricao,
          setor: antiga?.setor || "",
          funcionario: antiga?.funcionario,
          quantidade: i.quantidade,
          comprimento: antiga?.comprimento,
          largura: antiga?.largura,
          hrDia: antiga?.hrDia,
          dias: antiga?.dias,
        };
      });
      return {
        id: existente?.id || crypto.randomUUID(),
        item: existente?.item || String(idx + 1),
        titulo: f,
        tipo,
        linhas,
      };
    });
  };

  const assinatura = itensOrigem.map(i => `${i.familia || ""}|${i.codigo}|${i.quantidade}`).join(";");
  const lastSig = useRef<string | null>(null);
  useEffect(() => {
    if (readOnly) return;
    if (lastSig.current === assinatura) return;
    lastSig.current = assinatura;
    if (!itensOrigem.length) return;
    onChange(sincronizar(grupos));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assinatura, readOnly]);

  const addGrupo = () =>
    onChange([...grupos, { id: crypto.randomUUID(), item: "", titulo: "", tipo: "area", linhas: [] }]);

  const updGrupo = (id: string, patch: Partial<GrupoMemoria>) =>
    onChange(grupos.map(g => (g.id === id ? { ...g, ...patch } : g)));

  const delGrupo = (id: string) => onChange(grupos.filter(g => g.id !== id));

  const addLinha = (gid: string) =>
    onChange(grupos.map(g => g.id === gid ? {
      ...g,
      linhas: [...g.linhas, { id: crypto.randomUUID(), item: "", codigo: "", descricao: "", setor: "", quantidade: 1 }],
    } : g));

  const updLinha = (gid: string, lid: string, patch: Partial<LinhaMemoria>) =>
    onChange(grupos.map(g => g.id === gid ? {
      ...g, linhas: g.linhas.map(l => (l.id === lid ? { ...l, ...patch } : l)),
    } : g));

  const delLinha = (gid: string, lid: string) =>
    onChange(grupos.map(g => g.id === gid ? { ...g, linhas: g.linhas.filter(l => l.id !== lid) } : g));

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Os grupos são gerados a partir das abas Itens SCO e Materiais: o título vem do campo Família e as quantidades
        dos itens. Informe o setor (lista de setores do cliente) e as medidas — o total de cada grupo é automático.
      </p>

      {!readOnly && (
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onChange(sincronizar(grupos))} className="flex-1"
            disabled={itensOrigem.length === 0}>
            <RefreshCw className="mr-2 h-4 w-4" /> Sincronizar itens (SCO / Materiais)
          </Button>
          <Button variant="outline" onClick={addGrupo} className="flex-1">
            <Plus className="mr-2 h-4 w-4" /> Adicionar grupo
          </Button>
        </div>
      )}

      {grupos.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum grupo cadastrado na memória de cálculo.</p>
      )}

      {grupos.map(g => (
        <div key={g.id} className="border rounded-md p-3 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-[100px_1fr_200px_auto] gap-2 items-end">
            <div>
              <Label className="text-xs">Item</Label>
              <Input className="h-8" placeholder="1.2" value={g.item} disabled={readOnly}
                onChange={e => updGrupo(g.id, { item: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Título do grupo</Label>
              <Input className="h-8 uppercase" placeholder="MÃO DE OBRA DA ADMINISTRAÇÃO LOCAL" value={g.titulo}
                disabled={readOnly} onChange={e => updGrupo(g.id, { titulo: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Tipo de medição</Label>
              <Select value={g.tipo} disabled={readOnly} onValueChange={(v: TipoMemoria) => updGrupo(g.id, { tipo: v })}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="area">Área (qtd × comp. × larg.)</SelectItem>
                  <SelectItem value="mao_de_obra">Mão de obra (hr/dia × dias)</SelectItem>
                  <SelectItem value="unidade">Unidade (quantidade)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!readOnly && (
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => delGrupo(g.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">ITEM</TableHead>
                  <TableHead className="w-36">CÓDIGO</TableHead>
                  <TableHead>DESCRIÇÃO</TableHead>
                  <TableHead className="w-40">SETOR</TableHead>
                  {g.tipo === "mao_de_obra" ? (
                    <>
                      <TableHead className="w-44">FUNCIONÁRIO</TableHead>
                      <TableHead className="w-24">HR/DIA</TableHead>
                      <TableHead className="w-24">DIAS</TableHead>
                    </>
                  ) : g.tipo === "area" ? (
                    <>
                      <TableHead className="w-24">QUANT.</TableHead>
                      <TableHead className="w-28">COMPRIMENTO</TableHead>
                      <TableHead className="w-24">LARG.</TableHead>
                    </>
                  ) : (
                    <TableHead className="w-28">QUANT.</TableHead>
                  )}
                  <TableHead className="w-28">{UNIDADE_LABEL[g.tipo]}</TableHead>
                  {!readOnly && <TableHead className="w-12" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {g.linhas.map(l => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <Input className="h-8" value={l.item} disabled={readOnly}
                        onChange={e => updLinha(g.id, l.id, { item: e.target.value })} />
                    </TableCell>
                    <TableCell>
                      <Input className="h-8 font-mono text-xs" value={l.codigo} disabled={readOnly}
                        onChange={e => updLinha(g.id, l.id, { codigo: e.target.value })} />
                    </TableCell>
                    <TableCell>
                      <Input className="h-8" value={l.descricao} disabled={readOnly}
                        onChange={e => updLinha(g.id, l.id, { descricao: e.target.value })} />
                    </TableCell>
                    <TableCell>
                      {setores.length > 0 ? (
                        <SetorCombobox value={l.setor || ""} options={setores} disabled={readOnly}
                          onChange={v => updLinha(g.id, l.id, { setor: v })} />
                      ) : (
                        <Input className="h-8" value={l.setor} disabled={readOnly}
                          onChange={e => updLinha(g.id, l.id, { setor: e.target.value })} />
                      )}
                    </TableCell>
                    {g.tipo === "mao_de_obra" ? (
                      <>
                        <TableCell>
                          <Input className="h-8" value={l.funcionario || ""} disabled={readOnly}
                            onChange={e => updLinha(g.id, l.id, { funcionario: e.target.value })} />
                        </TableCell>
                        <TableCell>
                          <Input type="number" min={0} step="0.01" className="h-8" value={l.hrDia ?? ""} disabled={readOnly}
                            onChange={e => updLinha(g.id, l.id, { hrDia: Number(e.target.value) })} />
                        </TableCell>
                        <TableCell>
                          <Input type="number" min={0} step="0.01" className="h-8" value={l.dias ?? ""} disabled={readOnly}
                            onChange={e => updLinha(g.id, l.id, { dias: Number(e.target.value) })} />
                        </TableCell>
                      </>
                    ) : g.tipo === "area" ? (
                      <>
                        <TableCell>
                          <Input type="number" min={0} step="0.01" className="h-8" value={l.quantidade ?? ""} disabled={readOnly}
                            onChange={e => updLinha(g.id, l.id, { quantidade: Number(e.target.value) })} />
                        </TableCell>
                        <TableCell>
                          <Input type="number" min={0} step="0.0001" className="h-8" value={l.comprimento ?? ""} disabled={readOnly}
                            onChange={e => updLinha(g.id, l.id, { comprimento: Number(e.target.value) })} />
                        </TableCell>
                        <TableCell>
                          <Input type="number" min={0} step="0.0001" className="h-8" value={l.largura ?? ""} disabled={readOnly}
                            onChange={e => updLinha(g.id, l.id, { largura: Number(e.target.value) })} />
                        </TableCell>
                      </>
                    ) : (
                      <TableCell>
                        <Input type="number" min={0} step="0.01" className="h-8" value={l.quantidade ?? ""} disabled={readOnly}
                          onChange={e => updLinha(g.id, l.id, { quantidade: Number(e.target.value) })} />
                      </TableCell>
                    )}
                    <TableCell className="font-medium">{nf(calcLinha(g.tipo, l))}</TableCell>
                    {!readOnly && (
                      <TableCell>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => delLinha(g.id, l.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50">
                  <TableCell className="font-bold">TOTAL</TableCell>
                  <TableCell colSpan={g.tipo === "unidade" ? 4 : 6} />
                  <TableCell className="font-bold">{nf(calcGrupo(g))}</TableCell>
                  {!readOnly && <TableCell />}
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {!readOnly && (
            <Button size="sm" variant="outline" onClick={() => addLinha(g.id)}>
              <Plus className="mr-2 h-3.5 w-3.5" /> Adicionar linha
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
