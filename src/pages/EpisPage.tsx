import React, { useState, useMemo } from "react";
import { HardHat, Search, Trash2, FileDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useFuncionarios, EpiItem } from "@/contexts/FuncionariosContext";
import { useClientes } from "@/contexts/ClientesContext";
import { useCargos } from "@/contexts/CargosContext";
import { gerarPdfEpi } from "@/lib/gerarPdfEpi";

interface EpiComFuncionario extends EpiItem {
  funcionarioNome: string;
  funcionarioId: string;
  clienteNome: string;
  cargoNome: string;
}

import PaginationControls, { paginate } from "@/components/PaginationControls";

const EpisPage = () => {
  const { funcionarios } = useFuncionarios();
  const { clientes } = useClientes();
  const { cargos } = useCargos();
  const [search, setSearch] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("todos");
  const [page, setPage] = useState(1);

  const todosEpis = useMemo(() => {
    const lista: EpiComFuncionario[] = [];
    funcionarios.forEach((f) => {
      const epis = (f.epis as EpiItem[] | null) || [];
      const cliente = clientes.find((c) => c.id === f.clienteId);
      const cargo = cargos.find((c) => c.id === f.cargoId);
      epis.forEach((epi) => {
        lista.push({
          ...epi,
          funcionarioNome: f.nome,
          funcionarioId: f.id,
          clienteNome: cliente?.nome || "—",
          cargoNome: cargo?.nome || "—",
        });
      });
    });
    return lista;
  }, [funcionarios, clientes, cargos]);

  const filtered = useMemo(() => {
    let result = todosEpis;
    if (filtroCliente !== "todos") {
      result = result.filter((e) => e.clienteNome === filtroCliente);
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.funcionarioNome.toLowerCase().includes(s) ||
          e.descricao.toLowerCase().includes(s) ||
          (e.ca && e.ca.toLowerCase().includes(s))
      );
    }
    return result;
  }, [todosEpis, search, filtroCliente]);

  const { paginated, totalPages, safePage } = paginate(filtered, page);

  const resetPage = () => setPage(1);

  const clientesUnicos = useMemo(() => {
    const set = new Set(todosEpis.map((e) => e.clienteNome).filter((n) => n !== "—"));
    return Array.from(set).sort();
  }, [todosEpis]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-xl">
            <HardHat className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">EPIs</h1>
            <p className="text-sm text-muted-foreground">
              Controle de Equipamentos de Proteção Individual
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">
          {filtered.length} registro(s)
        </Badge>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por funcionário, EPI ou CA..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
          />
        </div>
        <Select value={filtroCliente} onValueChange={(v) => { setFiltroCliente(v); resetPage(); }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Clientes</SelectItem>
            {clientesUnicos.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {paginated.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <HardHat className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum EPI encontrado.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Funcionário</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead className="w-16 text-center">Qtd</TableHead>
                <TableHead>E.P.I</TableHead>
                <TableHead className="w-24 text-center">CA</TableHead>
                <TableHead className="w-32 text-center">Data Entrega</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((epi, idx) => (
                <TableRow key={`${epi.funcionarioId}-${epi.id}-${idx}`}>
                  <TableCell className="font-medium">{epi.funcionarioNome}</TableCell>
                  <TableCell>{epi.clienteNome}</TableCell>
                  <TableCell>{epi.cargoNome}</TableCell>
                  <TableCell className="text-center">{String(epi.quantidade).padStart(2, "0")}</TableCell>
                  <TableCell>{epi.descricao}</TableCell>
                  <TableCell className="text-center">{epi.ca || "—"}</TableCell>
                  <TableCell className="text-center">
                    {epi.dataEntrega ? epi.dataEntrega.split("-").reverse().join("/") : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <PaginationControls currentPage={page} totalItems={filtered.length} onPageChange={setPage} />
    </div>
  );
};

export default EpisPage;
