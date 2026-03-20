import { useRequisicoes, Requisicao } from "@/contexts/RequisicaoContext";
import { Badge } from "@/components/ui/badge";
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

  if (requisicoes.length === 0) {
    return (
      <div className="section-card text-center py-14 text-sm text-muted-foreground animate-fade-up" style={{ animationDelay: "600ms" }}>
        Nenhuma requisição enviada ainda.
      </div>
    );
  }

  return (
    <div className="section-card animate-fade-up overflow-hidden" style={{ animationDelay: "600ms" }}>
      <h2 className="section-title mb-3">Acompanhamento de Requisições</h2>
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {requisicoes.map((req) => (
              <TableRow key={req.id}>
                <TableCell className="pl-5 text-xs tabular-nums whitespace-nowrap">
                  {req.dataCriacao}
                </TableCell>
                <TableCell className="text-sm">{req.unidade}</TableCell>
                <TableCell className="text-sm font-medium">{req.cargoNome}</TableCell>
                <TableCell className="text-sm">{req.jornada || "—"}</TableCell>
                <TableCell className="text-sm">{req.origemVaga || "—"}</TableCell>
                <TableCell className="text-sm">{req.nomeSubstituido || "—"}</TableCell>
                <TableCell className="pr-5">
                  <Select
                    value={req.status}
                    onValueChange={(v) => updateStatus(req.id, v as Requisicao["status"])}
                  >
                    <SelectTrigger className="h-7 w-[130px] text-xs border-0 p-0 focus:ring-0">
                      <Badge variant="outline" className={`${statusColors[req.status]} text-xs font-medium`}>
                        {req.status}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default RequisicaoGrid;