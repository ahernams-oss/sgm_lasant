import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CategoriaVariacao, classificarVariacao } from "@/hooks/useConfirmacoesValores";
import { CheckCircle2, TrendingDown, TrendingUp, ShieldCheck, Upload, Loader2, BadgeCheck, AlertTriangle, Gavel, Settings2, RotateCcw } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ALCADA_BADGE, Alcada, LIMITE_ALCADA_PERCENTUAL, classificarAlcada } from "@/lib/alcadaReajuste";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useColumnVisibility, ColumnDef } from "@/hooks/useColumnVisibility";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export interface ItemConfirmacao {
  key: string;
  itemId: string;
  descricao: string;
  quantidade: number;
  unidadeMedida: string;
  precoAprovado: number;
  fornecedorId: string;
  fornecedorNome: string;
}

export interface AjusteConfirmacao {
  precoConfirmado: number;
  categoria: CategoriaVariacao;
  justificativa: string;
  alcada: Alcada;
  requerDiretoria: boolean;
}

export interface MetaConfirmacao {
  /** Diretoria notificada para aceite do aditivo de verba. */
  aceiteDiretoria: boolean;
  aprovadoPorAlcada: string;
}

const CATEGORIAS: CategoriaVariacao[] = ["Saving", "Cost Avoidance", "Reajuste"];

const CATEGORIA_BADGE: Record<CategoriaVariacao, string> = {
  "Saving": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Cost Avoidance": "bg-blue-100 text-blue-700 border-blue-200",
  "Reajuste": "bg-amber-100 text-amber-700 border-amber-200",
};

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Aceita "1.234,56" e "1234.56". */
function parseMoneyBR(raw: string): number {
  if (!raw) return 0;
  const s = raw.trim().replace(/[^\d.,-]/g, "");
  if (s.includes(",")) return Number(s.replace(/\./g, "").replace(",", ".")) || 0;
  return Number(s) || 0;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  itens: ItemConfirmacao[];
  onConfirm: (ajustes: Record<string, AjusteConfirmacao>, meta: MetaConfirmacao) => void | Promise<void>;
  /** Nome do coordenador/comprador que exerce a alçada expressa. */
  responsavel?: string;
}

export default function ConfirmacaoValoresDialog({ open, onOpenChange, itens, onConfirm, responsavel = "" }: Props) {
  const [aceiteDiretoria, setAceiteDiretoria] = useState(false);
  const [precos, setPrecos] = useState<Record<string, string>>({});
  const [categorias, setCategorias] = useState<Record<string, CategoriaVariacao>>({});
  const [justificativas, setJustificativas] = useState<Record<string, string>>({});
  const [manualCategoria, setManualCategoria] = useState<Record<string, boolean>>({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!open) return;
    const p: Record<string, string> = {};
    const c: Record<string, CategoriaVariacao> = {};
    itens.forEach(i => {
      p[i.key] = String(i.precoAprovado).replace(".", ",");
      c[i.key] = "Cost Avoidance";
    });
    setPrecos(p); setCategorias(c); setJustificativas({}); setManualCategoria({}); setSalvando(false); setAceiteDiretoria(false);
  }, [open, itens]);

  const linhas = useMemo(() => itens.map(i => {
    const precoConfirmado = parseMoneyBR(precos[i.key] ?? "");
    const valorAprovado = i.precoAprovado * i.quantidade;
    const valorConfirmado = precoConfirmado * i.quantidade;
    const variacao = valorConfirmado - valorAprovado;
    const perc = i.precoAprovado > 0 ? ((precoConfirmado - i.precoAprovado) / i.precoAprovado) * 100 : 0;
    const alcada = classificarAlcada(perc);
    return { ...i, precoConfirmado, valorAprovado, valorConfirmado, variacao, perc, alcada };
  }), [itens, precos]);

  const totais = useMemo(() => {
    let saving = 0, reajuste = 0, avoidance = 0, aprovado = 0, confirmado = 0;
    linhas.forEach(l => {
      aprovado += l.valorAprovado;
      confirmado += l.valorConfirmado;
      const cat = categorias[l.key] ?? "Cost Avoidance";
      if (cat === "Saving") saving += Math.max(0, -l.variacao);
      else if (cat === "Reajuste") reajuste += Math.max(0, l.variacao);
      else avoidance += l.valorConfirmado;
    });
    return { saving, reajuste, avoidance, aprovado, confirmado };
  }, [linhas, categorias]);

  const linhasDiretoria = useMemo(() => linhas.filter(l => l.alcada === "Diretoria"), [linhas]);
  const totalAditivo = useMemo(() => linhasDiretoria.reduce((s, l) => s + Math.max(0, l.variacao), 0), [linhasDiretoria]);
  const semJustificativa = useMemo(() => linhasDiretoria.some(l => !(justificativas[l.key] ?? "").trim()), [linhasDiretoria, justificativas]);
  const bloqueado = linhasDiretoria.length > 0 && (!aceiteDiretoria || semJustificativa);

  const setPreco = (key: string, value: string) => {
    setPrecos(prev => ({ ...prev, [key]: value }));
    if (!manualCategoria[key]) {
      const item = itens.find(i => i.key === key);
      if (item) {
        setCategorias(prev => ({ ...prev, [key]: classificarVariacao(item.precoAprovado, parseMoneyBR(value)) }));
      }
    }
  };

  const [lendoIa, setLendoIa] = useState(false);

  /** Repete o preço aprovado como confirmado (sem variação). */
  const manterPreco = (key: string) => {
    const item = itens.find(i => i.key === key);
    if (!item) return;
    setPrecos(prev => ({ ...prev, [key]: String(item.precoAprovado).replace(".", ",") }));
    if (!manualCategoria[key]) {
      setCategorias(prev => ({ ...prev, [key]: classificarVariacao(item.precoAprovado, item.precoAprovado) }));
    }
  };

  const manterTodos = () => itens.forEach(i => manterPreco(i.key));

  const handleArquivoIa = async (file: File | null) => {
    if (!file) return;
    setLendoIa(true);
    try {
      const base64: string = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
        r.onerror = reject;
        r.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("ler-proposta-cotacao", {
        body: {
          fileBase64: base64,
          mimeType: file.type || "application/pdf",
          fileName: file.name,
          itens: itens.map(i => ({
            itemId: i.itemId,
            descricao: i.descricao,
            quantidade: i.quantidade,
            unidadeMedida: i.unidadeMedida,
          })),
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      const lidos: any[] = Array.isArray((data as any)?.itens) ? (data as any).itens : [];
      let aplicados = 0;
      lidos.forEach(li => {
        if (li.precoUnitario == null) return;
        itens
          .filter(i => i.itemId === String(li.itemId))
          .forEach(i => {
            aplicados++;
            setPreco(i.key, String(Number(li.precoUnitario)).replace(".", ","));
          });
      });
      toast[aplicados > 0 ? "success" : "warning"](
        aplicados > 0 ? `${aplicados} preço(s) preenchido(s) pela IA.` : "Nenhum preço foi identificado no arquivo.",
      );
    } catch (e) {
      toast.error(`Não foi possível ler o arquivo: ${(e as Error).message}`);
    } finally {
      setLendoIa(false);
    }
  };

  const handleConfirm = async () => {
    setSalvando(true);
    const ajustes: Record<string, AjusteConfirmacao> = {};
    linhas.forEach(l => {
      ajustes[l.key] = {
        precoConfirmado: l.precoConfirmado > 0 ? l.precoConfirmado : l.precoAprovado,
        categoria: categorias[l.key] ?? "Cost Avoidance",
        justificativa: justificativas[l.key] ?? "",
        alcada: l.alcada,
        requerDiretoria: l.alcada === "Diretoria",
      };
    });
    try {
      await onConfirm(ajustes, { aceiteDiretoria, aprovadoPorAlcada: responsavel });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1200px] max-h-[90vh] overflow-auto resize min-w-[600px] min-h-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Confirmação de Valores — pós-aprovação da Diretoria
          </DialogTitle>
          <DialogDescription>
            Confirme os preços finais negociados antes da emissão da Ordem de Compra. A variação é classificada
            como <strong>Saving</strong> (economia real), <strong>Cost Avoidance</strong> (preço mantido após o
            vencimento da proposta) ou <strong>Reajuste</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Valor aprovado</p>
            <p className="text-lg font-semibold">{brl(totais.aprovado)}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Valor confirmado</p>
            <p className="text-lg font-semibold">{brl(totais.confirmado)}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingDown className="h-3 w-3" /> Saving</p>
            <p className="text-lg font-semibold text-emerald-600">{brl(totais.saving)}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Reajuste</p>
            <p className="text-lg font-semibold text-amber-600">{brl(totais.reajuste)}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            id="ia-confirmacao-file"
            type="file"
            accept="application/pdf,image/*"
            className="hidden"
            onChange={e => { handleArquivoIa(e.target.files?.[0] ?? null); e.currentTarget.value = ""; }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={lendoIa}
            onClick={() => document.getElementById("ia-confirmacao-file")?.click()}
          >
            {lendoIa ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            {lendoIa ? "Lendo documento..." : "Ler preços por IA (PDF/imagem)"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={manterTodos}>
            <BadgeCheck className="h-4 w-4 mr-2 text-emerald-600" />
            Manter todos os preços
          </Button>
        </div>

        {linhasDiretoria.length === 0 ? (
          <Alert>
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Alçada de aprovação expressa</AlertTitle>
            <AlertDescription className="text-xs">
              Reajustes de até {LIMITE_ALCADA_PERCENTUAL}% são aprovados de forma expressa pelo Coordenador de
              Compras/Manutenção{responsavel ? ` (${responsavel})` : ""}. Acima disso, a Diretoria é notificada para aceite do aditivo de verba.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Acima da alçada — aceite da Diretoria necessário</AlertTitle>
            <AlertDescription className="text-xs space-y-2">
              <p>
                {linhasDiretoria.length} item(ns) com reajuste acima de {LIMITE_ALCADA_PERCENTUAL}%, totalizando um
                aditivo de verba de <strong>{brl(totalAditivo)}</strong>. Informe a justificativa nesses itens e confirme
                a notificação à Diretoria.
              </p>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={aceiteDiretoria} onCheckedChange={v => setAceiteDiretoria(!!v)} />
                <span className="flex items-center gap-1"><Gavel className="h-3 w-3" /> Notificar a Diretoria e registrar o aceite do aditivo de verba</span>
              </label>
            </AlertDescription>
          </Alert>
        )}

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[220px]">Item</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="text-right">Preço aprovado</TableHead>
                <TableHead className="w-[180px]">Preço confirmado</TableHead>
                <TableHead className="text-right">Variação</TableHead>
                <TableHead className="w-[130px]">Alçada</TableHead>
                <TableHead className="w-[170px]">Categoria</TableHead>
                <TableHead className="min-w-[260px]">Justificativa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linhas.map(l => {
                const cat = categorias[l.key] ?? "Cost Avoidance";
                return (
                  <TableRow key={l.key}>
                    <TableCell className="text-sm">{l.descricao}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{l.fornecedorNome}</TableCell>
                    <TableCell className="text-right text-sm">{l.quantidade} {l.unidadeMedida}</TableCell>
                    <TableCell className="text-right text-sm">{brl(l.precoAprovado)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Input
                          value={precos[l.key] ?? ""}
                          onChange={e => setPreco(l.key, e.target.value)}
                          inputMode="decimal"
                          className="h-8 text-right"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          title="Sem variação: repetir o preço aprovado"
                          onClick={() => manterPreco(l.key)}
                        >
                          <BadgeCheck className="h-5 w-5 text-emerald-600" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className={`text-right text-sm font-medium ${l.variacao < 0 ? "text-emerald-600" : l.variacao > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
                      {brl(l.variacao)}
                      <span className="block text-[10px] font-normal">{l.perc.toFixed(2)}%</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${ALCADA_BADGE[l.alcada]}`}>
                        {l.alcada === "Diretoria" ? "Diretoria" : l.alcada === "Expressa" ? "Expressa" : "Sem reajuste"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={cat}
                        onValueChange={(v: CategoriaVariacao) => {
                          setManualCategoria(p => ({ ...p, [l.key]: true }));
                          setCategorias(p => ({ ...p, [l.key]: v }));
                        }}
                      >
                        <SelectTrigger className="h-8 text-left"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Badge variant="outline" className={`mt-1 text-[10px] ${CATEGORIA_BADGE[cat]}`}>{cat}</Badge>
                    </TableCell>
                    <TableCell className="min-w-[260px]">
                      <Input
                        value={justificativas[l.key] ?? ""}
                        onChange={e => setJustificativas(p => ({ ...p, [l.key]: e.target.value }))}
                        placeholder={l.alcada === "Diretoria" ? "Obrigatória (acima da alçada)" : "Opcional"}
                        className="h-8 w-full"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={salvando}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={salvando || bloqueado}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {salvando ? "Emitindo..." : "Confirmar valores e emitir OC"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
