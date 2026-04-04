import { useState } from "react";
import { useComunicacao } from "@/contexts/ComunicacaoContext";
import { useUsuarios } from "@/contexts/UsuariosContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { DoubleConfirmDelete, useDoubleConfirmDelete } from "@/components/DoubleConfirmDelete";
import PaginationControls, { paginate } from "@/components/PaginationControls";
import { Plus, Megaphone, Eye, CheckCircle2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ComunicacaoAvisos() {
  const { avisos, addAviso, updateAviso, deleteAviso, confirmarLeitura } = useComunicacao();
  const { usuarios } = useUsuarios();
  const { usuarioLogado } = useAuth();
  const { toast } = useToast();
  const { deleteId, requestDelete, cancelDelete } = useDoubleConfirmDelete();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialog, setDetailDialog] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ titulo: "", conteudo: "", prioridade: "Normal" });

  const filtered = avisos.filter(a => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return a.titulo.toLowerCase().includes(q) || a.conteudo.toLowerCase().includes(q);
  });

  const { paginated, totalPages } = paginate(filtered, page, 7);

  const handleSalvar = async () => {
    if (!form.titulo.trim() || !form.conteudo.trim()) {
      toast({ title: "Preencha título e conteúdo", variant: "destructive" });
      return;
    }
    await addAviso({
      titulo: form.titulo,
      conteudo: form.conteudo,
      prioridade: form.prioridade,
      criado_por: usuarioLogado?.nome || "",
    });
    setForm({ titulo: "", conteudo: "", prioridade: "Normal" });
    setDialogOpen(false);
    toast({ title: "Aviso publicado!" });
  };

  const handleConfirmarLeitura = async (avisoId: string) => {
    await confirmarLeitura({
      aviso_id: avisoId,
      usuario_nome: usuarioLogado?.nome || "",
      usuario_email: usuarioLogado?.email || "",
    });
    toast({ title: "Leitura confirmada!" });
  };

  const prioridadeColor = (p: string) => {
    switch (p) {
      case "Urgente": return "bg-yellow-500 text-white";
      case "Crítica": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const avisoDetail = avisos.find(a => a.id === detailDialog);
  const jaLeu = (aviso: any) => aviso.leituras?.some((l: any) => l.usuarioEmail === usuarioLogado?.email);

  return (
    <div className="space-y-4 pt-[15px] pl-0 pr-[10px]">
      <div className="flex items-center justify-between mx-[7px]">
        <h1 className="text-2xl font-bold">Avisos e Comunicados</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Novo Aviso
        </Button>
      </div>

      <div className="mx-[7px]">
        <Input
          placeholder="Buscar avisos..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="max-w-md"
        />
      </div>

      <div className="border rounded-lg mx-[7px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Criado por</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-center">Leituras</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhum aviso publicado
                </TableCell>
              </TableRow>
            ) : paginated.map(a => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.titulo}</TableCell>
                <TableCell>
                  <Badge className={prioridadeColor(a.prioridade)}>{a.prioridade}</Badge>
                </TableCell>
                <TableCell>{a.criadoPor}</TableCell>
                <TableCell>
                  {a.createdAt ? format(new Date(a.createdAt), "dd/MM/yy HH:mm", { locale: ptBR }) : "-"}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline">{a.leituras.length}/{usuarios.length}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  {jaLeu(a) ? (
                    <Badge className="bg-green-100 text-green-800 border-green-300">Lido</Badge>
                  ) : (
                    <Badge variant="destructive">Pendente</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setDetailDialog(a.id)} title="Detalhes">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {!jaLeu(a) && (
                      <Button size="icon" variant="ghost" onClick={() => handleConfirmarLeitura(a.id)} title="Confirmar leitura" className="text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => requestDelete(a.id)} title="Excluir">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PaginationControls currentPage={page} totalItems={filtered.length} onPageChange={setPage} pageSize={7} />

      {/* Dialog novo aviso */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Aviso</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />
            </div>
            <div>
              <Label>Conteúdo</Label>
              <Textarea value={form.conteudo} onChange={e => setForm(f => ({ ...f, conteudo: e.target.value }))} rows={4} />
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={form.prioridade} onValueChange={v => setForm(f => ({ ...f, prioridade: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="Urgente">Urgente</SelectItem>
                  <SelectItem value="Crítica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSalvar}>Publicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog detalhes do aviso */}
      <Dialog open={!!detailDialog} onOpenChange={() => setDetailDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{avisoDetail?.titulo}</DialogTitle>
          </DialogHeader>
          {avisoDetail && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground text-xs">Conteúdo</Label>
                <p className="text-sm whitespace-pre-wrap mt-1">{avisoDetail.conteudo}</p>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>Criado por: {avisoDetail.criadoPor}</span>
                <span>Prioridade: {avisoDetail.prioridade}</span>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Confirmações de Leitura ({avisoDetail.leituras.length})</Label>
                <div className="border rounded-md mt-1 max-h-40 overflow-y-auto">
                  {avisoDetail.leituras.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-3">Nenhuma confirmação</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Usuário</TableHead>
                          <TableHead className="text-xs">Data/Hora</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {avisoDetail.leituras.map(l => (
                          <TableRow key={l.id}>
                            <TableCell className="text-xs">{l.usuarioNome}</TableCell>
                            <TableCell className="text-xs">
                              {l.lidoEm ? format(new Date(l.lidoEm), "dd/MM/yy HH:mm", { locale: ptBR }) : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
              {!jaLeu(avisoDetail) && (
                <Button className="w-full" onClick={() => { handleConfirmarLeitura(avisoDetail.id); setDetailDialog(null); }}>
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Confirmar Leitura
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DoubleConfirmDelete
        open={!!deleteId}
        onOpenChange={(open) => { if (!open) cancelDelete(); }}
        onConfirm={async () => {
          if (deleteId) {
            await deleteAviso(deleteId);
            cancelDelete();
            toast({ title: "Aviso excluído" });
          }
        }}
      />
    </div>
  );
}
