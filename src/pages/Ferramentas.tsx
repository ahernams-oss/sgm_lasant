import { useState } from "react";
import { useFerramentas, Ferramenta, emptyFerramentaForm, FerramentaVinculo, FerramentaEmprestimo } from "@/contexts/FerramentasContext";
import { useFuncionarios } from "@/contexts/FuncionariosContext";
import { useClientes } from "@/contexts/ClientesContext";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { useCargos } from "@/contexts/CargosContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import FormSection from "@/components/FormSection";
import { Plus, Pencil, Trash2, Link, Unlink, ArrowRightLeft, Check, X, RotateCcw, FileText, Search, History } from "lucide-react";
import { downloadPdfTermoResponsabilidade } from "@/lib/gerarPdfTermoResponsabilidade";

const estadosConservacao = ["Novo", "Bom", "Regular", "Ruim", "Inservível"];
const statusOptions = ["Disponível", "Em Uso", "Emprestada", "Manutenção", "Baixada"];

export default function FerramentasPage() {
  const { ferramentas, vinculos, emprestimos, historico, addFerramenta, updateFerramenta, deleteFerramenta, addVinculoMulti, devolverVinculo, addEmprestimo, aprovarEmprestimo, rejeitarEmprestimo, devolverEmprestimo } = useFerramentas();
  const { funcionarios } = useFuncionarios();
  const { clientes } = useClientes();
  const { empresa } = useEmpresa();
  const { cargos } = useCargos();
  const { usuarioLogado } = useAuth();

  const [form, setForm] = useState<Omit<Ferramenta, "id">>(emptyFerramentaForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("cadastro");

  // Vínculo dialog
  const [vinculoOpen, setVinculoOpen] = useState(false);
  const [vinculoFerramentaIds, setVinculoFerramentaIds] = useState<string[]>([]);
  const [vinculoFuncionarioId, setVinculoFuncionarioId] = useState("");
  const [vinculoData, setVinculoData] = useState(new Date().toISOString().slice(0, 10));
  const [vinculoObs, setVinculoObs] = useState("");

  // Empréstimo dialog
  const [emprestimoOpen, setEmprestimoOpen] = useState(false);
  const [empFerramentaId, setEmpFerramentaId] = useState("");
  const [empDestinoId, setEmpDestinoId] = useState("");
  const [empDevolucaoPrevista, setEmpDevolucaoPrevista] = useState("");
  const [empObs, setEmpObs] = useState("");

  // Histórico dialog
  const [historicoOpen, setHistoricoOpen] = useState(false);
  const [historicoFerramentaId, setHistoricoFerramentaId] = useState("");

  const clientesTipo = clientes.filter(c => c.tipo === "Cliente");

  const handleSave = async () => {
    if (!form.codigo || !form.descricao) return;
    if (editId) {
      await updateFerramenta(editId, form);
    } else {
      await addFerramenta(form);
    }
    setForm(emptyFerramentaForm);
    setEditId(null);
    setFormOpen(false);
  };

  const handleEdit = (f: Ferramenta) => {
    const { id, ...rest } = f;
    setForm(rest);
    setEditId(id);
    setFormOpen(true);
  };

  const handleVincular = async () => {
    if (!vinculoFerramentaId || !vinculoFuncionarioId) return;
    const fer = ferramentas.find(f => f.id === vinculoFerramentaId);
    const func = funcionarios.find(f => f.id === vinculoFuncionarioId);
    if (!fer || !func) return;
    await addVinculo({
      ferramentaId: fer.id, ferramentaDescricao: `${fer.codigo} - ${fer.descricao}`,
      funcionarioId: func.id, funcionarioNome: func.nome,
      dataVinculo: vinculoData, dataDevolucao: "", observacoes: vinculoObs, status: "Ativo",
    });
    setVinculoOpen(false);
    setVinculoFerramentaId("");
    setVinculoFuncionarioId("");
    setVinculoObs("");
  };

  const handleGerarTermo = (v: FerramentaVinculo) => {
    const fer = ferramentas.find(f => f.id === v.ferramentaId);
    const func = funcionarios.find(f => f.id === v.funcionarioId);
    if (!fer || !func) return;
    const cargo = cargos.find(c => c.id === func.cargoId);
    const cliente = clientes.find(c => c.id === func.clienteId);
    downloadPdfTermoResponsabilidade({
      empresa: { razaoSocial: empresa.razaoSocial, cnpj: empresa.cnpj, logradouro: empresa.logradouro, numero: empresa.numero, bairro: empresa.bairro, cidade: empresa.cidade, uf: empresa.uf },
      funcionario: { nome: func.nome, cpf: func.cpf, cargo: cargo?.nome || "", setor: cliente?.nome || "" },
      ferramenta: { codigo: fer.codigo, descricao: fer.descricao, marca: fer.marca, modelo: fer.modelo, numeroSerie: fer.numeroSerie, patrimonio: fer.patrimonio, estadoConservacao: fer.estadoConservacao, valorAquisicao: fer.valorAquisicao },
      dataVinculo: v.dataVinculo,
    });
  };

  const handleSolicitarEmprestimo = async () => {
    if (!empFerramentaId || !empDestinoId) return;
    const fer = ferramentas.find(f => f.id === empFerramentaId);
    if (!fer) return;
    const destino = clientes.find(c => c.id === empDestinoId);
    if (!destino) return;
    await addEmprestimo({
      ferramentaId: fer.id, ferramentaDescricao: `${fer.codigo} - ${fer.descricao}`,
      centroCustoOrigemId: fer.centroCustoAtualId, centroCustoOrigemNome: fer.centroCustoAtualNome,
      centroCustoDestinoId: destino.id, centroCustoDestinoNome: destino.nome,
      solicitante: usuarioLogado?.nome || "", dataSolicitacao: new Date().toISOString().slice(0, 10),
      dataAprovacao: "", aprovadoPor: "", dataDevolucaoPrevista: empDevolucaoPrevista,
      dataDevolucaoReal: "", status: "Pendente", observacoes: empObs,
    });
    setEmprestimoOpen(false);
    setEmpFerramentaId("");
    setEmpDestinoId("");
    setEmpDevolucaoPrevista("");
    setEmpObs("");
  };

  const filteredFerramentas = ferramentas.filter(f =>
    `${f.codigo} ${f.descricao} ${f.marca} ${f.modelo} ${f.patrimonio}`.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = (s: string) => {
    if (s === "Disponível") return "bg-emerald-100 text-emerald-800";
    if (s === "Em Uso") return "bg-blue-100 text-blue-800";
    if (s === "Emprestada") return "bg-amber-100 text-amber-800";
    if (s === "Manutenção") return "bg-orange-100 text-orange-800";
    if (s === "Baixada") return "bg-red-100 text-red-800";
    return "";
  };

  const empStatusColor = (s: string) => {
    if (s === "Pendente") return "bg-amber-100 text-amber-800";
    if (s === "Aprovado") return "bg-emerald-100 text-emerald-800";
    if (s === "Rejeitado") return "bg-red-100 text-red-800";
    if (s === "Devolvido") return "bg-blue-100 text-blue-800";
    return "";
  };

  const historicoFerramenta = historico.filter(h => h.ferramentaId === historicoFerramentaId);

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-primary">Ferramentas e Equipamentos</h1>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="cadastro">Cadastro</TabsTrigger>
          <TabsTrigger value="vinculos">Vínculos</TabsTrigger>
          <TabsTrigger value="emprestimos">Empréstimos</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        {/* CADASTRO */}
        <TabsContent value="cadastro" className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar ferramentas..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Button onClick={() => { setForm(emptyFerramentaForm); setEditId(null); setFormOpen(true); }}><Plus className="mr-1 h-4 w-4" />Nova Ferramenta</Button>
          </div>

          <div className="border rounded-lg overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Marca/Modelo</TableHead>
                  <TableHead>Nº Série</TableHead>
                  <TableHead>Patrimônio</TableHead>
                  <TableHead>Centro de Custo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFerramentas.length === 0 && (
                  <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Nenhuma ferramenta cadastrada.</TableCell></TableRow>
                )}
                {filteredFerramentas.map(f => (
                  <TableRow key={f.id}>
                    <TableCell className="font-mono text-xs">{f.codigo}</TableCell>
                    <TableCell className="font-medium">{f.descricao}</TableCell>
                    <TableCell className="text-sm">{[f.marca, f.modelo].filter(Boolean).join(" / ") || "-"}</TableCell>
                    <TableCell className="text-xs">{f.numeroSerie || "-"}</TableCell>
                    <TableCell className="text-xs">{f.patrimonio || "-"}</TableCell>
                    <TableCell className="text-xs">{f.centroCustoAtualNome || "-"}</TableCell>
                    <TableCell className="text-xs">{f.estadoConservacao}</TableCell>
                    <TableCell><Badge className={statusColor(f.status)} variant="outline">{f.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button size="icon" variant="ghost" title="Editar" onClick={() => handleEdit(f)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" title="Histórico" onClick={() => { setHistoricoFerramentaId(f.id); setHistoricoOpen(true); }}><History className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" title="Vincular a Funcionário" disabled={f.status !== "Disponível"} onClick={() => { setVinculoFerramentaId(f.id); setVinculoOpen(true); }}><Link className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" title="Emprestar" disabled={f.status !== "Disponível"} onClick={() => { setEmpFerramentaId(f.id); setEmprestimoOpen(true); }}><ArrowRightLeft className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" title="Excluir" className="text-destructive" onClick={() => { if (confirm("Remover esta ferramenta?")) deleteFerramenta(f.id); }}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* VÍNCULOS */}
        <TabsContent value="vinculos" className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={() => { setVinculoFerramentaId(""); setVinculoOpen(true); }}><Plus className="mr-1 h-4 w-4" />Novo Vínculo</Button>
          </div>
          <div className="border rounded-lg overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ferramenta</TableHead>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Data Vínculo</TableHead>
                  <TableHead>Data Devolução</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vinculos.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum vínculo registrado.</TableCell></TableRow>
                )}
                {vinculos.map(v => (
                  <TableRow key={v.id}>
                    <TableCell className="text-sm">{v.ferramentaDescricao}</TableCell>
                    <TableCell className="text-sm">{v.funcionarioNome}</TableCell>
                    <TableCell className="text-sm">{v.dataVinculo}</TableCell>
                    <TableCell className="text-sm">{v.dataDevolucao || "-"}</TableCell>
                    <TableCell><Badge variant="outline" className={v.status === "Ativo" ? "bg-emerald-100 text-emerald-800" : "bg-muted"}>{v.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="outline" title="Gerar Termo" onClick={() => handleGerarTermo(v)}><FileText className="mr-1 h-4 w-4" />Termo</Button>
                        {v.status === "Ativo" && (
                          <Button size="sm" variant="outline" title="Devolver" onClick={() => devolverVinculo(v.id)}><Unlink className="mr-1 h-4 w-4" />Devolver</Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* EMPRÉSTIMOS */}
        <TabsContent value="emprestimos" className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={() => { setEmpFerramentaId(""); setEmprestimoOpen(true); }}><Plus className="mr-1 h-4 w-4" />Solicitar Empréstimo</Button>
          </div>
          <div className="border rounded-lg overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ferramenta</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Data Solicitação</TableHead>
                  <TableHead>Devolução Prevista</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emprestimos.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhum empréstimo registrado.</TableCell></TableRow>
                )}
                {emprestimos.map(e => (
                  <TableRow key={e.id}>
                    <TableCell className="text-sm">{e.ferramentaDescricao}</TableCell>
                    <TableCell className="text-sm">{e.centroCustoOrigemNome}</TableCell>
                    <TableCell className="text-sm">{e.centroCustoDestinoNome}</TableCell>
                    <TableCell className="text-sm">{e.solicitante}</TableCell>
                    <TableCell className="text-sm">{e.dataSolicitacao}</TableCell>
                    <TableCell className="text-sm">{e.dataDevolucaoPrevista || "-"}</TableCell>
                    <TableCell><Badge variant="outline" className={empStatusColor(e.status)}>{e.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        {e.status === "Pendente" && (
                          <>
                            <Button size="icon" variant="ghost" title="Aprovar" className="text-emerald-600" onClick={() => aprovarEmprestimo(e.id, usuarioLogado?.nome || "")}><Check className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" title="Rejeitar" className="text-destructive" onClick={() => rejeitarEmprestimo(e.id, usuarioLogado?.nome || "")}><X className="h-4 w-4" /></Button>
                          </>
                        )}
                        {e.status === "Aprovado" && (
                          <Button size="sm" variant="outline" onClick={() => devolverEmprestimo(e.id)}><RotateCcw className="mr-1 h-4 w-4" />Devolver</Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* HISTÓRICO */}
        <TabsContent value="historico" className="space-y-4">
          <div className="border rounded-lg overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Ferramenta</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Usuário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historico.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum registro no histórico.</TableCell></TableRow>
                )}
                {historico.map(h => (
                  <TableRow key={h.id}>
                    <TableCell className="text-sm">{h.dataEvento}</TableCell>
                    <TableCell className="text-sm">{h.ferramentaDescricao}</TableCell>
                    <TableCell><Badge variant="outline">{h.tipo}</Badge></TableCell>
                    <TableCell className="text-sm">{h.descricao}</TableCell>
                    <TableCell className="text-sm">{h.usuario || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog Cadastro */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Editar Ferramenta" : "Nova Ferramenta"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <FormSection title="Identificação">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div><Label>Código *</Label><Input value={form.codigo} onChange={e => setForm(p => ({ ...p, codigo: e.target.value }))} /></div>
                <div className="md:col-span-2"><Label>Descrição *</Label><Input value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} /></div>
                <div><Label>Marca</Label><Input value={form.marca} onChange={e => setForm(p => ({ ...p, marca: e.target.value }))} /></div>
                <div><Label>Modelo</Label><Input value={form.modelo} onChange={e => setForm(p => ({ ...p, modelo: e.target.value }))} /></div>
                <div><Label>Nº Série</Label><Input value={form.numeroSerie} onChange={e => setForm(p => ({ ...p, numeroSerie: e.target.value }))} /></div>
                <div><Label>Patrimônio</Label><Input value={form.patrimonio} onChange={e => setForm(p => ({ ...p, patrimonio: e.target.value }))} /></div>
                <div>
                  <Label>Estado de Conservação</Label>
                  <Select value={form.estadoConservacao} onValueChange={v => setForm(p => ({ ...p, estadoConservacao: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{estadosConservacao.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </FormSection>

            <FormSection title="Aquisição" delay={100}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div><Label>Valor de Aquisição</Label><Input type="number" step="0.01" value={form.valorAquisicao || ""} onChange={e => setForm(p => ({ ...p, valorAquisicao: parseFloat(e.target.value) || 0 }))} /></div>
                <div><Label>Data de Aquisição</Label><Input type="date" value={form.dataAquisicao} onChange={e => setForm(p => ({ ...p, dataAquisicao: e.target.value }))} /></div>
                <div><Label>Nota Fiscal</Label><Input value={form.notaFiscal} onChange={e => setForm(p => ({ ...p, notaFiscal: e.target.value }))} /></div>
              </div>
            </FormSection>

            <FormSection title="Calibração" delay={200}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div><Label>Data de Calibração</Label><Input type="date" value={form.dataCalibracao} onChange={e => setForm(p => ({ ...p, dataCalibracao: e.target.value }))} /></div>
                <div><Label>Validade da Calibração</Label><Input type="date" value={form.validadeCalibracao} onChange={e => setForm(p => ({ ...p, validadeCalibracao: e.target.value }))} /></div>
                <div><Label>Certificado (URL)</Label><Input value={form.certificadoCalibracaoUrl} onChange={e => setForm(p => ({ ...p, certificadoCalibracaoUrl: e.target.value }))} /></div>
              </div>
            </FormSection>

            <FormSection title="Localização" delay={300}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Centro de Custo Atual</Label>
                  <Select value={form.centroCustoAtualId} onValueChange={v => {
                    const c = clientesTipo.find(x => x.id === v);
                    setForm(p => ({ ...p, centroCustoAtualId: v, centroCustoAtualNome: c?.nome || "" }));
                  }}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{clientesTipo.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </FormSection>

            <div><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} rows={3} /></div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>{editId ? "Salvar" : "Cadastrar"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Vínculo */}
      <Dialog open={vinculoOpen} onOpenChange={setVinculoOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Vincular Ferramenta a Funcionário</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Ferramenta</Label>
              <Select value={vinculoFerramentaId} onValueChange={setVinculoFerramentaId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{ferramentas.filter(f => f.status === "Disponível").map(f => <SelectItem key={f.id} value={f.id}>{f.codigo} - {f.descricao}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Funcionário</Label>
              <Select value={vinculoFuncionarioId} onValueChange={setVinculoFuncionarioId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{funcionarios.filter(f => f.status === "Ativo").map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Data do Vínculo</Label><Input type="date" value={vinculoData} onChange={e => setVinculoData(e.target.value)} /></div>
            <div><Label>Observações</Label><Textarea value={vinculoObs} onChange={e => setVinculoObs(e.target.value)} rows={2} /></div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setVinculoOpen(false)}>Cancelar</Button>
              <Button onClick={handleVincular}>Vincular</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Empréstimo */}
      <Dialog open={emprestimoOpen} onOpenChange={setEmprestimoOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Solicitar Empréstimo de Ferramenta</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Ferramenta</Label>
              <Select value={empFerramentaId} onValueChange={setEmpFerramentaId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{ferramentas.filter(f => f.status === "Disponível").map(f => <SelectItem key={f.id} value={f.id}>{f.codigo} - {f.descricao} ({f.centroCustoAtualNome || "Sem CC"})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Centro de Custo Destino</Label>
              <Select value={empDestinoId} onValueChange={setEmpDestinoId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{clientesTipo.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Devolução Prevista</Label><Input type="date" value={empDevolucaoPrevista} onChange={e => setEmpDevolucaoPrevista(e.target.value)} /></div>
            <div><Label>Observações</Label><Textarea value={empObs} onChange={e => setEmpObs(e.target.value)} rows={2} /></div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEmprestimoOpen(false)}>Cancelar</Button>
              <Button onClick={handleSolicitarEmprestimo}>Solicitar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Histórico Individual */}
      <Dialog open={historicoOpen} onOpenChange={setHistoricoOpen}>
        <DialogContent className="max-w-2xl max-h-[70vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Histórico da Ferramenta</DialogTitle></DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Usuário</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historicoFerramenta.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-4">Sem registros.</TableCell></TableRow>
              )}
              {historicoFerramenta.map(h => (
                <TableRow key={h.id}>
                  <TableCell className="text-sm">{h.dataEvento}</TableCell>
                  <TableCell><Badge variant="outline">{h.tipo}</Badge></TableCell>
                  <TableCell className="text-sm">{h.descricao}</TableCell>
                  <TableCell className="text-sm">{h.usuario || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
}
