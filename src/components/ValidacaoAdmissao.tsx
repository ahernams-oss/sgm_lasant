import { useEffect, useState, useCallback } from "react";
import { portalCall } from "@/lib/portalClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, Eye, Download, FileText, RefreshCw, ShieldCheck, FileCheck } from "lucide-react";
import { toast } from "sonner";
import type { Candidato } from "@/contexts/ProcessoSeletivoContext";

interface DocRow {
  id: string;
  tipo_documento: string;
  nome_arquivo: string;
  storage_path: string;
  status: "pendente" | "aprovado" | "reprovado";
  observacao: string | null;
  enviado_em: string;
  revisado_em: string | null;
  tamanho_bytes: number | null;
}
interface FichaRow {
  id: string;
  status: "rascunho" | "enviada" | "em_analise" | "aprovada" | "reprovada";
  dados_pessoais: any;
  endereco: any;
  bancarios: any;
  dependentes: any[];
  contatos_emergencia: any[];
  observacoes_rh: string | null;
  enviado_em: string | null;
  revisado_em: string | null;
}
interface TermoRow {
  id: string;
  tipo_termo: string;
  versao_termo: string;
  hash_sha256: string;
  assinado_em: string;
}

interface Props {
  candidato: Candidato;
  onExameChange: (patch: Partial<Candidato["exameAdmissional"]>) => void;
  onDadosBancariosPrefill: (b: Partial<Candidato["dadosBancarios"]>) => void;
}

const statusBadge = (s: string) => {
  const map: Record<string, { cls: string; label: string; icon: any }> = {
    pendente: { cls: "bg-amber-100 text-amber-800 border-amber-300", label: "Pendente", icon: Clock },
    aprovado: { cls: "bg-emerald-100 text-emerald-800 border-emerald-300", label: "Aprovado", icon: CheckCircle2 },
    reprovado: { cls: "bg-red-100 text-red-800 border-red-300", label: "Reprovado", icon: XCircle },
    enviada: { cls: "bg-blue-100 text-blue-800 border-blue-300", label: "Enviada", icon: FileCheck },
    em_analise: { cls: "bg-amber-100 text-amber-800 border-amber-300", label: "Em análise", icon: Clock },
    aprovada: { cls: "bg-emerald-100 text-emerald-800 border-emerald-300", label: "Aprovada", icon: CheckCircle2 },
    reprovada: { cls: "bg-red-100 text-red-800 border-red-300", label: "Reprovada", icon: XCircle },
    rascunho: { cls: "bg-slate-100 text-slate-700 border-slate-300", label: "Rascunho", icon: Clock },
  };
  const m = map[s] || map.pendente;
  const Icon = m.icon;
  return <Badge variant="outline" className={`${m.cls} gap-1`}><Icon className="h-3 w-3" />{m.label}</Badge>;
};

const fmtDate = (iso?: string | null) => iso ? new Date(iso).toLocaleString("pt-BR") : "—";

const Row = ({ label, value }: { label: string; value: any }) => (
  <div className="flex flex-col">
    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
    <span className="text-sm">{value || <span className="text-muted-foreground">—</span>}</span>
  </div>
);

export default function ValidacaoAdmissao({ candidato, onExameChange, onDadosBancariosPrefill }: Props) {
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [ficha, setFicha] = useState<FichaRow | null>(null);
  const [termos, setTermos] = useState<TermoRow[]>([]);
  const [obsRh, setObsRh] = useState("");
  const [docObs, setDocObs] = useState<Record<string, string>>({});
  const cpf = (candidato.cpf || "").replace(/\D/g, "");

  const carregar = useCallback(async () => {
    if (!cpf || cpf.length !== 11) return;
    setLoading(true);
    try {
      const res = await portalCall<{ ficha: FichaRow | null; documentos: DocRow[]; termos: TermoRow[] }>(
        "admin-cand-validacao", { cpf },
      );
      setDocs(res.documentos || []);
      setFicha(res.ficha);
      setTermos(res.termos || []);
      setObsRh(res.ficha?.observacoes_rh || "");
      // Pré-preenche dados bancários do candidato local a partir do portal se estiverem vazios
      const b = res.ficha?.bancarios || {};
      if (b && Object.keys(b).length && !candidato.dadosBancarios?.banco) {
        onDadosBancariosPrefill({
          banco: b.banco || "", agencia: b.agencia || "", conta: b.conta || "",
          tipoConta: b.tipoConta || "", pisPasep: b.pisPasep || "", pix: b.pix || "",
        });
      }
    } catch (e: any) {
      toast.error("Erro ao carregar dados do portal: " + e.message);
    } finally {
      setLoading(false);
    }
  }, [cpf]); // eslint-disable-line

  useEffect(() => { carregar(); }, [carregar]);

  const abrirDoc = async (id: string) => {
    try {
      const { url } = await portalCall<{ url: string }>("admin-cand-doc-url", { id });
      if (url) window.open(url, "_blank");
    } catch (e: any) { toast.error(e.message); }
  };
  const baixarDoc = async (id: string, nome: string) => {
    try {
      const { url } = await portalCall<{ url: string }>("admin-cand-doc-url", { id });
      if (!url) return;
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = nome; a.click();
      URL.revokeObjectURL(a.href);
    } catch (e: any) { toast.error(e.message); }
  };
  const setDocStatus = async (id: string, status: "aprovado" | "reprovado" | "pendente") => {
    try {
      await portalCall("admin-cand-doc-status", { id, status, observacao: docObs[id] || null });
      setDocs((prev) => prev.map((d) => d.id === id ? { ...d, status, observacao: docObs[id] || null, revisado_em: new Date().toISOString() } : d));
      toast.success("Status atualizado.");
    } catch (e: any) { toast.error(e.message); }
  };
  const setFichaStatus = async (status: "em_analise" | "aprovada" | "reprovada") => {
    if (!cpf) return;
    try {
      await portalCall("admin-cand-ficha-status", { cpf, status, observacoes_rh: obsRh || null });
      setFicha((f) => f ? { ...f, status, observacoes_rh: obsRh, revisado_em: new Date().toISOString() } : f);
      toast.success("Ficha atualizada.");
    } catch (e: any) { toast.error(e.message); }
  };

  const dp = ficha?.dados_pessoais || {};
  const en = ficha?.endereco || {};
  const ba = ficha?.bancarios || {};

  const totalDocs = docs.length;
  const aprovDocs = docs.filter((d) => d.status === "aprovado").length;
  const reprDocs = docs.filter((d) => d.status === "reprovado").length;

  // Row is defined at module scope (below) to avoid re-creating the component
  // on every render and to prevent React "cannot give refs to function components" warnings.


  return (
    <div className="space-y-6">
      {/* Header + refresh */}
      <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
        <div className="flex items-center gap-2 text-sm">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Validação de admissão · CPF <span className="font-mono">{candidato.cpf || "—"}</span>
          {ficha && statusBadge(ficha.status)}
        </div>
        <Button variant="outline" size="sm" onClick={carregar} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} /> Atualizar
        </Button>
      </div>

      {/* Termos */}
      <section>
        <h3 className="text-sm font-semibold mb-2">📜 Termos assinados</h3>
        {termos.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum termo assinado pelo candidato.</p>
        ) : (
          <div className="space-y-1">
            {termos.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded border px-3 py-1.5 text-xs">
                <div>
                  <span className="font-medium">{t.tipo_termo}</span>
                  <span className="text-muted-foreground"> · v{t.versao_termo} · {fmtDate(t.assinado_em)}</span>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[220px]" title={t.hash_sha256}>{t.hash_sha256.slice(0, 24)}…</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Ficha */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">🧾 Ficha cadastral do portal</h3>
          {ficha && (
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => setFichaStatus("em_analise")}>Em análise</Button>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setFichaStatus("aprovada")}>Aprovar</Button>
              <Button size="sm" variant="destructive" onClick={() => setFichaStatus("reprovada")}>Reprovar</Button>
            </div>
          )}
        </div>
        {!ficha ? (
          <p className="text-xs text-muted-foreground">Candidato ainda não preencheu a ficha no portal.</p>
        ) : (
          <div className="space-y-4 rounded-md border p-3">
            <div>
              <div className="text-xs font-semibold mb-1 text-muted-foreground">Dados Pessoais</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Row label="Nome" value={dp.nome} />
                <Row label="CPF" value={dp.cpf} />
                <Row label="Data Nasc." value={dp.dataNascimento} />
                <Row label="Sexo" value={dp.sexo} />
                <Row label="Estado Civil" value={dp.estadoCivil} />
                <Row label="Nacionalidade" value={dp.nacionalidade} />
                <Row label="Naturalidade" value={dp.naturalidade} />
                <Row label="Escolaridade" value={dp.escolaridade} />
                <Row label="Curso/Formação" value={dp.formacao} />
                <Row label="Nome Mãe" value={dp.nomeMae} />
                <Row label="Nome Pai" value={dp.nomePai} />
                <Row label="E-mail" value={dp.email} />
                <Row label="Telefone" value={dp.telefone} />
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold mb-1 text-muted-foreground">Endereço</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Row label="CEP" value={en.cep} />
                <Row label="Logradouro" value={en.logradouro} />
                <Row label="Nº" value={en.numero} />
                <Row label="Compl." value={en.complemento} />
                <Row label="Bairro" value={en.bairro} />
                <Row label="Cidade" value={en.cidade} />
                <Row label="UF" value={en.uf} />
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold mb-1 text-muted-foreground">Dados Bancários</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Row label="Banco" value={ba.banco} />
                <Row label="Agência" value={ba.agencia} />
                <Row label="Conta" value={ba.conta} />
                <Row label="Tipo" value={ba.tipoConta} />
                <Row label="PIS/PASEP" value={ba.pisPasep} />
                <Row label="PIX" value={ba.pix} />
              </div>
            </div>
            {Array.isArray(ficha.dependentes) && ficha.dependentes.length > 0 && (
              <div>
                <div className="text-xs font-semibold mb-1 text-muted-foreground">Dependentes ({ficha.dependentes.length})</div>
                <div className="space-y-1">
                  {ficha.dependentes.map((d: any, i: number) => (
                    <div key={i} className="text-xs rounded border px-2 py-1">
                      {d.nome} · {d.parentesco} · nasc. {d.dataNascimento || "—"}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {Array.isArray(ficha.contatos_emergencia) && ficha.contatos_emergencia.length > 0 && (
              <div>
                <div className="text-xs font-semibold mb-1 text-muted-foreground">Contatos de Emergência ({ficha.contatos_emergencia.length})</div>
                <div className="space-y-1">
                  {ficha.contatos_emergencia.map((c: any, i: number) => (
                    <div key={i} className="text-xs rounded border px-2 py-1">
                      {c.nome} · {c.parentesco} · {c.telefone}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Observações do RH</label>
              <Textarea rows={2} value={obsRh} onChange={(e) => setObsRh(e.target.value)} placeholder="Notas internas sobre a validação da ficha…" />
            </div>
            <div className="text-[10px] text-muted-foreground">
              Enviada em {fmtDate(ficha.enviado_em)} · Última revisão {fmtDate(ficha.revisado_em)}
            </div>
          </div>
        )}
      </section>

      {/* Documentos */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">📁 Documentos enviados pelo portal</h3>
          <span className="text-xs text-muted-foreground">{aprovDocs} aprov. · {reprDocs} reprov. · {totalDocs} total</span>
        </div>
        {docs.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum documento enviado pelo candidato.</p>
        ) : (
          <div className="space-y-2">
            {docs.map((d) => (
              <div key={d.id} className="rounded-md border p-2 space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{d.tipo_documento}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {d.nome_arquivo} · {d.tamanho_bytes ? (d.tamanho_bytes / 1024).toFixed(0) + " KB · " : ""}
                      enviado {fmtDate(d.enviado_em)}
                    </div>
                  </div>
                  {statusBadge(d.status)}
                  <Button variant="ghost" size="sm" onClick={() => abrirDoc(d.id)} title="Visualizar">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => baixarDoc(d.id, d.nome_arquivo)} title="Baixar">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    className="h-8 text-xs"
                    placeholder="Observação (opcional)"
                    value={docObs[d.id] ?? d.observacao ?? ""}
                    onChange={(e) => setDocObs((p) => ({ ...p, [d.id]: e.target.value }))}
                  />
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setDocStatus(d.id, "aprovado")}>
                    Aprovar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setDocStatus(d.id, "reprovado")}>
                    Reprovar
                  </Button>
                  {d.status !== "pendente" && (
                    <Button size="sm" variant="outline" onClick={() => setDocStatus(d.id, "pendente")}>
                      Reabrir
                    </Button>
                  )}
                </div>
                {d.revisado_em && (
                  <div className="text-[10px] text-muted-foreground">Revisado em {fmtDate(d.revisado_em)}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Exame Admissional (editor RH) */}
      <section>
        <h3 className="text-sm font-semibold mb-2">🏥 Exame Admissional</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Data do Exame</label>
            <Input type="date" value={candidato.exameAdmissional?.dataExame || ""}
              onChange={(e) => onExameChange({ dataExame: e.target.value })} className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Resultado</label>
            <select
              value={candidato.exameAdmissional?.resultado || "pendente"}
              onChange={(e) => onExameChange({ resultado: e.target.value as any })}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="pendente">Pendente</option>
              <option value="apto">Apto</option>
              <option value="inapto">Inapto</option>
            </select>
          </div>
        </div>
        <div className="mt-3">
          <label className="text-xs font-medium text-muted-foreground">Observações</label>
          <Textarea rows={2} value={candidato.exameAdmissional?.observacoes || ""}
            onChange={(e) => onExameChange({ observacoes: e.target.value })} />
        </div>
      </section>
    </div>
  );
}

export function validacaoPodeEfetivar(ficha: FichaRow | null, docs: DocRow[]) {
  if (!ficha) return { ok: false, msg: "Ficha do portal não recebida." };
  if (ficha.status !== "aprovada") return { ok: false, msg: "Aprovar a ficha cadastral do portal." };
  if (docs.length === 0) return { ok: false, msg: "Nenhum documento recebido do portal." };
  if (docs.some((d) => d.status === "pendente")) return { ok: false, msg: "Há documentos pendentes de revisão." };
  if (docs.some((d) => d.status === "reprovado")) return { ok: false, msg: "Há documentos reprovados — solicite reenvio ao candidato." };
  return { ok: true, msg: "" };
}
