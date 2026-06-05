import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Eye, Download, XCircle, Loader2, Receipt } from "lucide-react";
import { useNfses, ModeloEmissaoNfse, NfseEmitida } from "@/contexts/NfsesContext";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { useClientes } from "@/contexts/ClientesContext";
import PaginationControls, { paginate } from "@/components/PaginationControls";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

const formatBRL = (v: number) => (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const formatDate = (s: string | null) => {
  if (!s) return "—";
  const d = new Date(s);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const STATUS_COLORS: Record<string, string> = {
  rascunho: "bg-muted text-muted-foreground",
  processando: "bg-blue-100 text-blue-800",
  emitida: "bg-green-100 text-green-800",
  rejeitada: "bg-red-100 text-red-800",
  cancelada: "bg-orange-100 text-orange-800",
};

export default function NfseEmitir() {
  const { nfses, config, loading, emitir, cancelar, remover } = useNfses();
  const { empresa } = useEmpresa();
  const { clientes } = useClientes();

  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroCliente, setFiltroCliente] = useState<string>("");
  const [filtroBusca, setFiltroBusca] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [openEmit, setOpenEmit] = useState(false);
  const [viewNfse, setViewNfse] = useState<NfseEmitida | null>(null);
  const [cancelTarget, setCancelTarget] = useState<NfseEmitida | null>(null);
  const [motivoCancel, setMotivoCancel] = useState("");

  const filtrados = useMemo(() => {
    let lista = nfses;
    if (filtroStatus !== "todos") lista = lista.filter((n) => n.status === filtroStatus);
    if (filtroCliente) lista = lista.filter((n) => n.cliente_id === filtroCliente);
    if (filtroBusca) {
      const q = filtroBusca.toLowerCase();
      lista = lista.filter((n) =>
        String(n.numero_dps).includes(q) ||
        (n.tomador?.razaoSocial || "").toLowerCase().includes(q) ||
        (n.chave_acesso || "").includes(q)
      );
    }
    return lista;
  }, [nfses, filtroStatus, filtroCliente, filtroBusca]);

  const { paginated: pageItems } = paginate(filtrados, page, perPage);

  const kpis = useMemo(() => {
    const mes = new Date().getMonth(), ano = new Date().getFullYear();
    const noMes = nfses.filter((n) => {
      const d = n.data_emissao ? new Date(n.data_emissao) : null;
      return d && d.getMonth() === mes && d.getFullYear() === ano;
    });
    return {
      emitidas: noMes.filter((n) => n.status === "emitida").length,
      rejeitadas: nfses.filter((n) => n.status === "rejeitada").length,
      canceladas: nfses.filter((n) => n.status === "cancelada").length,
      totalIss: noMes.filter((n) => n.status === "emitida").reduce((s, n) => s + Number(n.valor_iss || 0), 0),
    };
  }, [nfses]);

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-bold">NFS-e Nacional</h1>
        <Button onClick={() => setOpenEmit(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Emitir NFS-e
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Emitidas no mês" value={String(kpis.emitidas)} icon={<Receipt className="w-5 h-5" />} />
        <KpiCard label="Rejeitadas" value={String(kpis.rejeitadas)} icon={<XCircle className="w-5 h-5" />} />
        <KpiCard label="Canceladas" value={String(kpis.canceladas)} icon={<XCircle className="w-5 h-5" />} />
        <KpiCard label="ISS no mês" value={formatBRL(kpis.totalIss)} icon={<FileText className="w-5 h-5" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">NFS-e emitidas</CardTitle>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Input placeholder="Buscar por número, tomador, chave..." value={filtroBusca}
              onChange={(e) => { setFiltroBusca(e.target.value); setPage(1); }} className="w-72" />
            <Select value={filtroStatus} onValueChange={(v) => { setFiltroStatus(v); setPage(1); }}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="rascunho">Rascunho</SelectItem>
                <SelectItem value="processando">Processando</SelectItem>
                <SelectItem value="emitida">Emitida</SelectItem>
                <SelectItem value="rejeitada">Rejeitada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroCliente || "todos"} onValueChange={(v) => { setFiltroCliente(v === "todos" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-64"><SelectValue placeholder="Cliente" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os clientes</SelectItem>
                {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome || c.nomeFantasia}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número/Série</TableHead>
                <TableHead>Emissão</TableHead>
                <TableHead>Tomador</TableHead>
                <TableHead className="text-right">Valor Serviço</TableHead>
                <TableHead className="text-right">ISS</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ambiente</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={8} className="text-center py-6"><Loader2 className="w-4 h-4 animate-spin inline" /></TableCell></TableRow>}
              {!loading && pageItems.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-6">Nenhuma NFS-e emitida</TableCell></TableRow>
              )}
              {pageItems.map((n) => (
                <TableRow key={n.id}>
                  <TableCell className="font-mono">{n.numero_dps}/{n.serie}</TableCell>
                  <TableCell>{formatDate(n.data_emissao || n.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{n.tomador?.razaoSocial || "—"}</span>
                      <span className="text-xs text-muted-foreground">{n.tomador?.documento}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatBRL(n.valor_servico)}</TableCell>
                  <TableCell className="text-right">{formatBRL(n.valor_iss)}</TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[n.status] || ""}>{n.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{n.ambiente === 1 ? "Produção" : "Homologação"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => setViewNfse(n)} title="Ver detalhes"><Eye className="w-4 h-4" /></Button>
                      {n.xml_nfse && (
                        <Button size="icon" variant="ghost" title="Baixar XML"
                          onClick={() => downloadText(`nfse-${n.numero_dps}.xml`, n.xml_nfse!)}>
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      {n.status === "emitida" && (
                        <Button size="icon" variant="ghost" title="Cancelar"
                          onClick={() => { setCancelTarget(n); setMotivoCancel(""); }}>
                          <XCircle className="w-4 h-4 text-orange-600" />
                        </Button>
                      )}
                      {(n.status === "rejeitada" || n.status === "rascunho") && (
                        <Button size="icon" variant="ghost" title="Remover"
                          onClick={() => { if (confirm("Remover este rascunho?")) remover(n.id); }}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PaginationControls currentPage={page} totalItems={filtrados.length} onPageChange={setPage} pageSize={perPage} onPageSizeChange={setPerPage} />
        </CardContent>
      </Card>

      <EmitirDialog open={openEmit} onClose={() => setOpenEmit(false)} />

      {/* Visualização */}
      <Dialog open={!!viewNfse} onOpenChange={(o) => !o && setViewNfse(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>NFS-e {viewNfse?.numero_dps}/{viewNfse?.serie}</DialogTitle></DialogHeader>
          {viewNfse && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <Info label="Status" value={viewNfse.status} />
                <Info label="Ambiente" value={viewNfse.ambiente === 1 ? "Produção" : "Homologação"} />
                <Info label="Chave de acesso" value={viewNfse.chave_acesso || "—"} />
                <Info label="Protocolo" value={viewNfse.protocolo || "—"} />
                <Info label="Data emissão" value={formatDate(viewNfse.data_emissao)} />
                <Info label="Competência" value={viewNfse.data_competencia || "—"} />
              </div>
              <div>
                <h4 className="font-semibold mt-2">Tomador</h4>
                <p>{viewNfse.tomador?.razaoSocial} — {viewNfse.tomador?.documento}</p>
              </div>
              <div>
                <h4 className="font-semibold mt-2">Serviço</h4>
                <p className="whitespace-pre-wrap">{viewNfse.servico?.descricao}</p>
                <p className="text-xs text-muted-foreground">Cód. trib. municipal: {viewNfse.servico?.codigoTributacaoMunicipio}</p>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-2">
                <Info label="Valor serviço" value={formatBRL(viewNfse.valor_servico)} />
                <Info label="ISS" value={formatBRL(viewNfse.valor_iss)} />
                <Info label="Líquido" value={formatBRL(viewNfse.valor_liquido)} />
              </div>
              {viewNfse.mensagem_retorno && (
                <div className="bg-muted p-3 rounded text-xs">
                  <strong>Retorno:</strong>
                  <p className="whitespace-pre-wrap">{viewNfse.mensagem_retorno}</p>
                </div>
              )}
              {viewNfse.xml_dps && (
                <details className="text-xs">
                  <summary className="cursor-pointer">Ver XML DPS assinado</summary>
                  <pre className="bg-muted p-2 rounded mt-2 overflow-auto max-h-80">{viewNfse.xml_dps}</pre>
                </details>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancelar */}
      <Dialog open={!!cancelTarget} onOpenChange={(o) => !o && setCancelTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cancelar NFS-e {cancelTarget?.numero_dps}</DialogTitle></DialogHeader>
          <Label>Motivo do cancelamento</Label>
          <Textarea value={motivoCancel} onChange={(e) => setMotivoCancel(e.target.value)} rows={4} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>Voltar</Button>
            <Button onClick={async () => {
              if (motivoCancel.length < 15) return toast.error("Motivo deve ter ao menos 15 caracteres");
              await cancelar(cancelTarget!.id, motivoCancel);
              toast.success("NFS-e cancelada");
              setCancelTarget(null);
            }}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KpiCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card><CardContent className="p-4 flex items-center gap-3">
      <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
      <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-xl font-bold">{value}</p></div>
    </CardContent></Card>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return <div><p className="text-xs text-muted-foreground">{label}</p><p className="font-medium">{value}</p></div>;
}

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ====================== Dialog de Emissão ======================
function EmitirDialog({ open, onClose, initial }: { open: boolean; onClose: () => void; initial?: Partial<ModeloEmissaoNfse> }) {
  const { empresa } = useEmpresa();
  const { clientes } = useClientes();
  const { emitir, config } = useNfses();

  const [submitting, setSubmitting] = useState(false);
  const [clienteId, setClienteId] = useState<string>("");
  const [descricao, setDescricao] = useState("");
  const [codigoTrib, setCodigoTrib] = useState<string>(config?.codigo_servico_padrao || "");
  const [codigoNbs, setCodigoNbs] = useState<string>(config?.codigo_nbs || "");
  const [valorServico, setValorServico] = useState<string>("0,00");
  const [deducoes, setDeducoes] = useState<string>("0,00");
  const [aliquotaIss, setAliquotaIss] = useState<string>(String(config?.aliquota_iss_padrao || "5"));
  const [issRetido, setIssRetido] = useState<boolean>(!!config?.iss_retido_padrao);
  const [senhaCert, setSenhaCert] = useState("");

  const cliente = clientes.find((c) => c.id === clienteId);

  const parseNum = (s: string) => Number(String(s).replace(/\./g, "").replace(",", ".")) || 0;

  const onSubmit = async () => {
    if (!empresa?.id) return toast.error("Cadastre os dados da empresa primeiro");
    if (!empresa.certificadoA1Url) return toast.error("Cadastre o certificado A1 em Dados da Empresa");
    if (!cliente) return toast.error("Selecione o tomador (cliente)");
    if (!descricao) return toast.error("Informe a descrição do serviço");
    if (!codigoTrib) return toast.error("Informe o código de tributação municipal (LC 116)");
    if (!senhaCert) return toast.error("Informe a senha do certificado A1");

    const modelo: ModeloEmissaoNfse = {
      empresaId: empresa.id,
      ambiente: (config?.ambiente as 1 | 2) || 2,
      serie: config?.serie_padrao || "00001",
      clienteId,
      prestador: {
        cnpj: empresa.cnpj, im: empresa.inscricaoMunicipal, razaoSocial: empresa.razaoSocial,
        codigoMunicipio: config?.codigo_municipio_prestador || "0000000",
        optanteSimples: !!config?.optante_simples,
        regimeTributario: config?.regime_tributario || "1",
      },
      tomador: {
        tipo: (cliente as any).cnpj ? "CNPJ" : "CPF",
        documento: (cliente as any).cnpj || (cliente as any).cpf || "",
        razaoSocial: cliente.nome || cliente.nomeFantasia,
        inscricaoMunicipal: (cliente as any).inscricaoMunicipal,
        email: (cliente as any).email,
        endereco: {
          logradouro: (cliente as any).logradouro, numero: (cliente as any).numero,
          complemento: (cliente as any).complemento, bairro: (cliente as any).bairro,
          codigoMunicipio: (cliente as any).codigoMunicipio || config?.codigo_municipio_prestador,
          uf: (cliente as any).uf, cep: (cliente as any).cep,
        },
      },
      servico: {
        descricao,
        codigoTributacaoMunicipio: codigoTrib,
        codigoNbs: codigoNbs || undefined,
        valorServico: parseNum(valorServico),
        deducoes: parseNum(deducoes),
      },
      tributos: {
        aliquotaIss: parseNum(aliquotaIss),
        issRetido,
      },
      certificadoSenha: senhaCert,
    };

    setSubmitting(true);
    const res = await emitir(modelo);
    setSubmitting(false);
    if (res.ok) {
      toast.success("NFS-e enviada para autorização");
      onClose();
    } else {
      toast.error(res.mensagem || "Falha ao emitir NFS-e");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Emitir NFS-e Nacional</DialogTitle></DialogHeader>

        <Tabs defaultValue="tomador">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="tomador">Tomador</TabsTrigger>
            <TabsTrigger value="servico">Serviço</TabsTrigger>
            <TabsTrigger value="tributos">Tributos</TabsTrigger>
            <TabsTrigger value="emitir">Emitir</TabsTrigger>
          </TabsList>

          <TabsContent value="tomador" className="space-y-3 pt-3">
            <Label>Cliente / Tomador</Label>
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger><SelectValue placeholder="Selecione o tomador..." /></SelectTrigger>
              <SelectContent>
                {clientes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nome || c.nomeFantasia} — {(c as any).cnpj || (c as any).cpf || "—"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {cliente && (
              <div className="text-sm bg-muted p-3 rounded">
                <p><strong>{cliente.nome}</strong></p>
                <p>{(cliente as any).logradouro}, {(cliente as any).numero} — {(cliente as any).bairro}</p>
                <p>{(cliente as any).cidade}/{(cliente as any).uf} — CEP {(cliente as any).cep}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="servico" className="space-y-3 pt-3">
            <div>
              <Label>Descrição do serviço</Label>
              <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Código de tributação municipal (LC 116)</Label>
                <Input value={codigoTrib} onChange={(e) => setCodigoTrib(e.target.value)} placeholder="ex: 01.07" />
              </div>
              <div>
                <Label>Código NBS (opcional)</Label>
                <Input value={codigoNbs} onChange={(e) => setCodigoNbs(e.target.value)} />
              </div>
              <div>
                <Label>Valor do serviço (R$)</Label>
                <Input value={valorServico} onChange={(e) => setValorServico(e.target.value)} />
              </div>
              <div>
                <Label>Deduções (R$)</Label>
                <Input value={deducoes} onChange={(e) => setDeducoes(e.target.value)} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tributos" className="space-y-3 pt-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Alíquota ISS (%)</Label>
                <Input value={aliquotaIss} onChange={(e) => setAliquotaIss(e.target.value)} />
              </div>
              <div className="flex items-end gap-2">
                <input id="issRet" type="checkbox" checked={issRetido} onChange={(e) => setIssRetido(e.target.checked)} />
                <Label htmlFor="issRet">ISS retido pelo tomador</Label>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="emitir" className="space-y-3 pt-3">
            <div className="bg-muted p-3 rounded text-sm space-y-1">
              <p><strong>Prestador:</strong> {empresa?.razaoSocial} — {empresa?.cnpj}</p>
              <p><strong>Ambiente:</strong> {config?.ambiente === 1 ? "Produção" : "Homologação"}</p>
              <p><strong>Série:</strong> {config?.serie_padrao || "00001"}</p>
              <p><strong>Tomador:</strong> {cliente?.nome || "—"}</p>
              <p><strong>Valor:</strong> {formatBRL(parseNum(valorServico))} • <strong>ISS:</strong> {formatBRL(parseNum(valorServico) * parseNum(aliquotaIss) / 100)}</p>
            </div>
            <div>
              <Label>Senha do certificado A1</Label>
              <Input type="password" value={senhaCert} onChange={(e) => setSenhaCert(e.target.value)} autoComplete="off" />
              <p className="text-xs text-muted-foreground mt-1">A senha é usada apenas para assinar o XML e não é armazenada.</p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Emitindo...</> : "Emitir NFS-e"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
