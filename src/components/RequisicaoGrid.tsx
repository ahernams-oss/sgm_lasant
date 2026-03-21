import { useState, useMemo } from "react";
import { useRequisicoes, Requisicao } from "@/contexts/RequisicaoContext";
import { useClientes } from "@/contexts/ClientesContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileDown, ClipboardCheck, Search } from "lucide-react";
import { gerarPdfRequisicao } from "@/lib/gerarPdfRequisicao";
import { enviarWhatsApp } from "@/lib/whatsapp";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const statusColors: Record<Requisicao["status"], string> = {
  Pendente: "bg-amber-100 text-amber-800 border-amber-200",
  "Em Análise": "bg-blue-100 text-blue-800 border-blue-200",
  Aprovada: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Reprovada: "bg-red-100 text-red-800 border-red-200",
};

const statusOptions: Requisicao["status"][] = ["Pendente", "Em Análise", "Aprovada", "Reprovada"];

const RequisicaoGrid = () => {
  const { requisicoes, updateStatus } = useRequisicoes();
  const { clientes } = useClientes();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todos");

  const handleStatusChange = (req: Requisicao, newStatus: Requisicao["status"]) => {
    updateStatus(req.id, newStatus);

    // Encontrar o cliente pela unidade e enviar WhatsApp
    const cliente = clientes.find((c) => c.nome === req.unidade);
    if (cliente && cliente.telefones.length > 0) {
      const mensagem = `Olá ${cliente.contato || cliente.nome}! A requisição do cargo "${req.cargoNome}" teve o status atualizado para: ${newStatus}.`;
      for (const tel of cliente.telefones) {
        enviarWhatsApp(tel, mensagem).then((result) => {
          if (result.success) {
            toast.success(`WhatsApp enviado para ${tel}`);
          } else {
            toast.error(`Falha ao enviar WhatsApp para ${tel}: ${result.error}`);
          }
        });
      }
    }
  };

  const filteredRequisicoes = useMemo(() => {
    let result = requisicoes;
    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.cargoNome.toLowerCase().includes(term) ||
          r.unidade.toLowerCase().includes(term) ||
          (r.nomeSubstituido || "").toLowerCase().includes(term) ||
          (r.origemVaga || "").toLowerCase().includes(term) ||
          r.dataCriacao.toLowerCase().includes(term)
      );
    }
    if (filterStatus !== "todos") {
      result = result.filter((r) => r.status === filterStatus);
    }
    return result;
  }, [requisicoes, search, filterStatus]);

  if (requisicoes.length === 0) {
    return (
      <div className="section-card text-center py-14 text-sm text-muted-foreground animate-fade-up" style={{ animationDelay: "600ms" }}>
        Nenhuma requisição enviada ainda.
      </div>
    );
  }

  return (
    <div className="section-card animate-fade-up overflow-hidden" style={{ animationDelay: "600ms" }}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
        <h2 className="section-title mb-0">Acompanhamento de Requisições</h2>
        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-9 w-[140px] text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Status</SelectItem>
              {statusOptions.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative w-52">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Pesquisar requisições..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
        </div>
      </div>
      {filteredRequisicoes.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-10">Nenhum resultado encontrado.</p>
      ) : (
        <div className="overflow-x-auto -mx-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Data</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Jornada</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Substituído</TableHead>
                <TableHead className="pr-5">Status</TableHead>
                <TableHead className="text-center">PDF</TableHead>
                <TableHead className="pr-5 text-center">Seletivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequisicoes.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="pl-5 text-xs tabular-nums whitespace-nowrap">{req.dataCriacao}</TableCell>
                  <TableCell className="text-sm">{req.unidade}</TableCell>
                  <TableCell className="text-sm font-medium">{req.cargoNome}</TableCell>
                  <TableCell className="text-sm">{req.jornada || "—"}</TableCell>
                  <TableCell className="text-sm">{req.origemVaga || "—"}</TableCell>
                  <TableCell className="text-sm">{req.nomeSubstituido || "—"}</TableCell>
                  <TableCell className="pr-5">
                    <Select value={req.status} onValueChange={(v) => handleStatusChange(req, v as Requisicao["status"])}>
                      <SelectTrigger className="h-7 w-[130px] text-xs border-0 p-0 focus:ring-0">
                        <Badge variant="outline" className={`${statusColors[req.status]} text-xs font-medium`}>{req.status}</Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-primary" title="Baixar PDF" onClick={() => gerarPdfRequisicao(req)}>
                      <FileDown className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell className="pr-5 text-center">
                    {req.status === "Aprovada" && (
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-primary" title="Processo Seletivo" onClick={() => navigate(`/processo-seletivo/${req.id}`)}>
                        <ClipboardCheck className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default RequisicaoGrid;
