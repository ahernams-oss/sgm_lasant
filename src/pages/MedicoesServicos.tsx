import { useState } from "react";
import { format } from "date-fns";
import { Plus, Ruler, Trash2, Edit, Eye, X, ChevronDown, ChevronUp, CalendarIcon, FileText, Download } from "lucide-react";
import { downloadPdfMedicoes } from "@/lib/gerarPdfMedicoes";
import { downloadExcelMedicoes } from "@/lib/gerarExcelMedicoes";
import { downloadPdfHistoricoMedicao } from "@/lib/gerarPdfHistoricoMedicao";
import { downloadExcelHistoricoMedicao } from "@/lib/gerarExcelHistoricoMedicao";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { useMedicoes, MedicaoServico, ItemServico, LancamentoMedicao } from "@/contexts/MedicoesContext";
import { useClientes } from "@/contexts/ClientesContext";

const emptyItem = (): ItemServico => ({
  id: crypto.randomUUID(),
  descricao: "",
  unidade: "un",
  quantidade_contratada: 0,
  valor_unitario: 0,
  valor_total_contratado: 0,
});

const MedicoesServicos = () => {
  const { medicoes, loading, addMedicao, updateMedicao, deleteMedicao } = useMedicoes();
  const { clientes } = useClientes();
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showLancamento, setShowLancamento] = useState(false);

  // Form state
  const [clienteId, setClienteId] = useState("");
  const [clienteNome, setClienteNome] = useState("");
  const [contrato, setContrato] = useState("");
  const [descricao, setDescricao] = useState("");
  const [itens, setItens] = useState<ItemServico[]>([emptyItem()]);
  const [observacoes, setObservacoes] = useState("");
  const [fornecedorId, setFornecedorId] = useState("");
  const [fornecedorNome, setFornecedorNome] = useState("");
  const [dataPagamento, setDataPagamento] = useState<Date | undefined>(undefined);

  // Lançamento state
  const [lancTipo, setLancTipo] = useState<"percentual" | "valor">("percentual");
  const [lancItens, setLancItens] = useState<{ item_id: string; descricao: string; percentual: number; valor: number; quantidade: number }[]>([]);
  const [lancObs, setLancObs] = useState("");
  const [lancDataPagamento, setLancDataPagamento] = useState<Date | undefined>(undefined);

  const resetForm = () => {
    setClienteId("");
    setClienteNome("");
    setFornecedorId("");
    setFornecedorNome("");
    setDataPagamento(undefined);
    setContrato("");
    setDescricao("");
    setItens([emptyItem()]);
    setObservacoes("");
    setEditId(null);
  };

  const handleOpenForm = (m?: MedicaoServico) => {
    if (m) {
      setEditId(m.id);
      setClienteId(m.cliente_id);
      setClienteNome(m.cliente_nome);
      setFornecedorId((m as any).fornecedor_id || "");
      setFornecedorNome((m as any).fornecedor_nome || "");
      setDataPagamento((m as any).data_pagamento ? new Date((m as any).data_pagamento) : undefined);
      setContrato(m.contrato);
      setDescricao(m.descricao);
      setItens(m.itens.length > 0 ? m.itens : [emptyItem()]);
      setObservacoes(m.observacoes);
    } else {
      resetForm();
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!descricao.trim()) {
      toast({ title: "Preencha a descrição da obra/serviço", variant: "destructive" });
      return;
    }
    const valorTotal = itens.reduce((s, i) => s + (i.quantidade_contratada * i.valor_unitario), 0);
    const itensCalc = itens.map(i => ({ ...i, valor_total_contratado: i.quantidade_contratada * i.valor_unitario }));

    const nextNum = editId ? undefined : (medicoes.length > 0 ? Math.max(...medicoes.map(m => m.numero)) + 1 : 1);

    const payload: any = {
      cliente_id: clienteId,
      cliente_nome: clienteNome,
      fornecedor_id: fornecedorId,
      fornecedor_nome: fornecedorNome,
      data_pagamento: dataPagamento ? format(dataPagamento, "yyyy-MM-dd") : null,
      contrato,
      descricao,
      itens: itensCalc,
      valor_total_contratado: valorTotal,
      observacoes,
    };
    if (nextNum !== undefined) payload.numero = nextNum;

    if (editId) {
      await updateMedicao(editId, payload);
      toast({ title: "Medição atualizada com sucesso" });
    } else {
      payload.status = "Em Andamento";
      payload.valor_total_medido = 0;
      payload.percentual_medido = 0;
      payload.medicoes = [];
      await addMedicao(payload);
      toast({ title: "Medição criada com sucesso" });
    }
    setShowForm(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteMedicao(id);
    toast({ title: "Medição excluída" });
  };

  // Item management
  const updateItem = (idx: number, field: keyof ItemServico, value: any) => {
    const copy = [...itens];
    (copy[idx] as any)[field] = value;
    setItens(copy);
  };

  const addItem = () => setItens([...itens, emptyItem()]);
  const removeItem = (idx: number) => setItens(itens.filter((_, i) => i !== idx));

  // Lançamento de medição
  const openLancamento = (m: MedicaoServico) => {
    setDetailId(m.id);
    setLancTipo("percentual");
    setLancItens(m.itens.map(i => ({
      item_id: i.id,
      descricao: i.descricao,
      percentual: 0,
      valor: 0,
      quantidade: 0,
    })));
    setLancObs("");
    setLancDataPagamento((m as any).data_pagamento ? new Date((m as any).data_pagamento) : undefined);
    setShowLancamento(true);
  };

  const saveLancamento = async () => {
    const med = medicoes.find(m => m.id === detailId);
    if (!med) return;

    const numMedicao = (med.medicoes?.length || 0) + 1;
    const today = new Date().toISOString().split("T")[0];

    const lancItensCalc = lancItens.map(li => {
      const item = med.itens.find(i => i.id === li.item_id);
      if (!item) return li;
      if (lancTipo === "percentual") {
        return { ...li, valor: (li.percentual / 100) * item.valor_total_contratado };
      }
      return { ...li, percentual: item.valor_total_contratado > 0 ? (li.valor / item.valor_total_contratado) * 100 : 0 };
    });

    const valorLanc = lancItensCalc.reduce((s, li) => s + li.valor, 0);
    const novoMedido = med.valor_total_medido + valorLanc;
    const novoPerc = med.valor_total_contratado > 0 ? (novoMedido / med.valor_total_contratado) * 100 : 0;

    if (novoPerc > 100) {
      toast({ title: "Erro: A medição ultrapassaria 100% do valor contratado", variant: "destructive" });
      return;
    }
    if (novoMedido > med.valor_total_contratado) {
      toast({ title: "Erro: O valor medido não pode ser maior que o valor contratado", variant: "destructive" });
      return;
    }

    const novasMedicoes: LancamentoMedicao[] = [
      ...(med.medicoes || []),
      {
        id: crypto.randomUUID(),
        numero: numMedicao,
        data: today,
        tipo: lancTipo,
        itens: lancItensCalc,
        valor_total: valorLanc,
        percentual_total: med.valor_total_contratado > 0 ? (valorLanc / med.valor_total_contratado) * 100 : 0,
        status: "Liberada",
        observacao: lancObs,
      },
    ];

    await updateMedicao(med.id, {
      medicoes: novasMedicoes,
      valor_total_medido: novoMedido,
      percentual_medido: novoPerc,
      status: novoPerc >= 100 ? "Concluída" : "Em Andamento",
      data_pagamento: lancDataPagamento ? format(lancDataPagamento, "yyyy-MM-dd") : null,
    } as any);

    toast({ title: `Medição #${numMedicao} lançada com sucesso` });
    setShowLancamento(false);
  };

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const fmtPerc = (v: number) => `${v.toFixed(2)}%`;

  const detailMedicao = medicoes.find(m => m.id === detailId);

  const statusColor = (s: string) => {
    if (s === "Concluída") return "default";
    if (s === "Em Andamento") return "secondary";
    return "outline";
  };

  return (
    <div className="bg-background">
      <div className="container max-w-full mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-up flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Ruler className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Engenharia</span>
            </div>
            <h1 className="text-xl font-bold text-foreground mb-1">Medição de Serviços de Obras</h1>
            <p className="text-sm text-muted-foreground max-w-lg">
              Controle e libere medições de serviços por percentual ou valor.
            </p>
          </div>
          {!showForm && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => downloadPdfMedicoes(medicoes)}>
                <FileText className="mr-1 h-4 w-4" /> PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadExcelMedicoes(medicoes)}>
                <Download className="mr-1 h-4 w-4" /> Excel
              </Button>
              <Button onClick={() => handleOpenForm()} className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Medição
              </Button>
            </div>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <Card className="mb-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{editId ? "Editar Medição" : "Nova Medição"}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); resetForm(); }}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cliente / Obra</Label>
                  <Select value={clienteId} onValueChange={(v) => {
                    setClienteId(v);
                    const c = clientes.find(c => c.id === v);
                    setClienteNome(c?.nome || "");
                  }}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {clientes.filter(c => c.tipo === "Cliente").map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fornecedor</Label>
                  <Select value={fornecedorId} onValueChange={(v) => {
                    setFornecedorId(v);
                    const f = clientes.find(c => c.id === v);
                    setFornecedorNome(f?.nome || "");
                  }}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {clientes.filter(c => c.tipo === "Fornecedor").map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contrato</Label>
                  <Input value={contrato} onChange={e => setContrato(e.target.value)} placeholder="Nº do contrato" />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descrição do serviço" />
                </div>
              </div>

              {/* Itens de serviço */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold">Itens de Serviço</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-3 w-3 mr-1" /> Adicionar Item
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">Descrição</TableHead>
                        <TableHead>Unidade</TableHead>
                        <TableHead>Qtd. Contratada</TableHead>
                        <TableHead>Valor Unitário</TableHead>
                        <TableHead>Valor Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itens.map((item, idx) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Input value={item.descricao} onChange={e => updateItem(idx, "descricao", e.target.value)} />
                          </TableCell>
                          <TableCell>
                            <Input className="w-20" value={item.unidade} onChange={e => updateItem(idx, "unidade", e.target.value)} />
                          </TableCell>
                          <TableCell>
                            <Input type="number" className="w-28" value={item.quantidade_contratada} onChange={e => updateItem(idx, "quantidade_contratada", Number(e.target.value))} />
                          </TableCell>
                          <TableCell>
                            <Input type="number" className="w-28" value={item.valor_unitario} onChange={e => updateItem(idx, "valor_unitario", Number(e.target.value))} />
                          </TableCell>
                          <TableCell className="font-medium">
                            {fmt(item.quantidade_contratada * item.valor_unitario)}
                          </TableCell>
                          <TableCell>
                            {itens.length > 1 && (
                              <Button variant="ghost" size="icon" onClick={() => removeItem(idx)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={2} />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>Cancelar</Button>
                <Button onClick={handleSave}>{editId ? "Salvar Alterações" : "Criar Medição"}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Grid */}
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : medicoes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma medição cadastrada.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº</TableHead>
                  <TableHead>Cliente / Obra</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor Contratado</TableHead>
                  <TableHead className="text-right">Valor Medido</TableHead>
                  <TableHead className="text-right">% Medido</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {medicoes.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono">{m.numero}</TableCell>
                    <TableCell>{m.cliente_nome}</TableCell>
                    <TableCell>{m.contrato}</TableCell>
                    <TableCell>{m.descricao}</TableCell>
                    <TableCell className="text-right">{fmt(m.valor_total_contratado)}</TableCell>
                    <TableCell className="text-right">{fmt(m.valor_total_medido)}</TableCell>
                    <TableCell className="text-right">{fmtPerc(m.percentual_medido)}</TableCell>
                    <TableCell><Badge variant={statusColor(m.status)}>{m.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" title="Lançar Medição" onClick={() => openLancamento(m)}>
                          <Ruler className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Detalhes" onClick={() => { setDetailId(m.id); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Editar" onClick={() => handleOpenForm(m)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Excluir" onClick={() => handleDelete(m.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Detail Dialog */}
        {detailMedicao && !showLancamento && (
          <Dialog open onOpenChange={() => setDetailId(null)}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle>Medição #{detailMedicao.numero} — {detailMedicao.descricao}</DialogTitle>
                  <div className="flex gap-2 mr-6">
                    <Button variant="outline" size="sm" onClick={() => downloadPdfHistoricoMedicao(detailMedicao)}>
                      <FileText className="mr-1 h-4 w-4" /> PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => downloadExcelHistoricoMedicao(detailMedicao)}>
                      <Download className="mr-1 h-4 w-4" /> Excel
                    </Button>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Cliente:</span> <strong>{detailMedicao.cliente_nome}</strong></div>
                  <div><span className="text-muted-foreground">Contrato:</span> <strong>{detailMedicao.contrato}</strong></div>
                  <div><span className="text-muted-foreground">Valor Contratado:</span> <strong>{fmt(detailMedicao.valor_total_contratado)}</strong></div>
                  <div><span className="text-muted-foreground">% Medido:</span> <strong>{fmtPerc(detailMedicao.percentual_medido)}</strong></div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full transition-all"
                    style={{ width: `${Math.min(detailMedicao.percentual_medido, 100)}%` }}
                  />
                </div>

                <h3 className="font-semibold text-sm">Histórico de Medições</h3>
                {detailMedicao.medicoes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma medição lançada.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-right">%</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailMedicao.medicoes.map(l => (
                        <TableRow key={l.id}>
                          <TableCell>{l.numero}</TableCell>
                          <TableCell>{l.data}</TableCell>
                          <TableCell className="capitalize">{l.tipo}</TableCell>
                          <TableCell className="text-right">{fmt(l.valor_total)}</TableCell>
                          <TableCell className="text-right">{fmtPerc(l.percentual_total)}</TableCell>
                          <TableCell><Badge variant="outline">{l.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Lançamento Dialog */}
        {showLancamento && detailMedicao && (
          <Dialog open onOpenChange={() => setShowLancamento(false)}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Lançar Medição — {detailMedicao.descricao}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Label>Tipo de Lançamento:</Label>
                  <Select value={lancTipo} onValueChange={(v: any) => setLancTipo(v)}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentual">Percentual</SelectItem>
                      <SelectItem value="valor">Valor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Contratado</TableHead>
                      {lancTipo === "percentual" ? (
                        <TableHead className="text-right">% a Medir</TableHead>
                      ) : (
                        <TableHead className="text-right">Valor a Medir</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lancItens.map((li, idx) => {
                      const item = detailMedicao.itens.find(i => i.id === li.item_id);
                      return (
                        <TableRow key={li.item_id}>
                          <TableCell>{li.descricao}</TableCell>
                          <TableCell className="text-right">{item ? fmt(item.valor_total_contratado) : "-"}</TableCell>
                          <TableCell className="text-right">
                            {lancTipo === "percentual" ? (
                              <Input
                                type="number"
                                className="w-24 ml-auto"
                                value={li.percentual}
                                onChange={e => {
                                  const copy = [...lancItens];
                                  copy[idx].percentual = Number(e.target.value);
                                  if (item) copy[idx].valor = (Number(e.target.value) / 100) * item.valor_total_contratado;
                                  setLancItens(copy);
                                }}
                              />
                            ) : (
                              <Input
                                type="number"
                                className="w-28 ml-auto"
                                value={li.valor}
                                onChange={e => {
                                  const copy = [...lancItens];
                                  copy[idx].valor = Number(e.target.value);
                                  if (item && item.valor_total_contratado > 0) {
                                    copy[idx].percentual = (Number(e.target.value) / item.valor_total_contratado) * 100;
                                  }
                                  setLancItens(copy);
                                }}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                <div className="text-right font-semibold text-sm">
                  Total desta medição: {fmt(lancItens.reduce((s, li) => s + li.valor, 0))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data de Pagamento</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn("w-full justify-start text-left font-normal", !lancDataPagamento && "text-muted-foreground")}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {lancDataPagamento ? format(lancDataPagamento, "dd/MM/yyyy") : "Selecione a data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={lancDataPagamento}
                          onSelect={setLancDataPagamento}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Observação</Label>
                    <Textarea value={lancObs} onChange={e => setLancObs(e.target.value)} rows={2} />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowLancamento(false)}>Cancelar</Button>
                  <Button onClick={saveLancamento}>Lançar Medição</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default MedicoesServicos;
