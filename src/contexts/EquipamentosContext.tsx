import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { fetchAll, insertRow, updateRow, deleteRow } from "@/lib/supabaseHelper";

export interface Equipamento {
  id: string;
  clienteId: string;
  clienteNome: string;
  localId: string;
  localDescricao: string;
  pavimentoId: string;
  pavimentoDescricao: string;
  setorId: string;
  setorDescricao: string;
  situacao: string;
  tag: string;
  equipamento: string;
  serie: string;
  grupo: string;
  subgrupo: string;
  modelo: string;
  valor: number;
  fabricante: string;
  dataAquisicao: string;
  nivelRisco: string;
  nivelManutencao: string;
  expectativaVida: string;
  dataGarantia: string;
  tensao: string;
  corrente: string;
  potencia: string;
  capacidadeBtu: string;
  contrato: string;
  planoManutencao: string;
  numeroAnvisa: string;
  fotoUrl: string;
  manualUrl: string;
}

interface EquipamentosContextType {
  equipamentos: Equipamento[];
  addEquipamento: (e: Omit<Equipamento, "id">) => void;
  updateEquipamento: (id: string, e: Partial<Omit<Equipamento, "id">>) => void;
  deleteEquipamento: (id: string) => void;
}

const EquipamentosContext = createContext<EquipamentosContextType | undefined>(undefined);

const rowToEquipamento = (r: any): Equipamento => ({
  id: r.id,
  clienteId: r.cliente_id ?? "",
  clienteNome: r.cliente_nome ?? "",
  localId: r.local_id ?? "",
  localDescricao: r.local_descricao ?? "",
  pavimentoId: r.pavimento_id ?? "",
  pavimentoDescricao: r.pavimento_descricao ?? "",
  setorId: r.setor_id ?? "",
  setorDescricao: r.setor_descricao ?? "",
  situacao: r.situacao ?? "Ativo",
  tag: r.tag ?? "",
  equipamento: r.equipamento ?? "",
  serie: r.serie ?? "",
  grupo: r.grupo ?? "",
  subgrupo: r.subgrupo ?? "",
  modelo: r.modelo ?? "",
  valor: Number(r.valor) || 0,
  fabricante: r.fabricante ?? "",
  dataAquisicao: r.data_aquisicao ?? "",
  nivelRisco: r.nivel_risco ?? "",
  nivelManutencao: r.nivel_manutencao ?? "",
  expectativaVida: r.expectativa_vida ?? "",
  dataGarantia: r.data_garantia ?? "",
  tensao: r.tensao ?? "",
  corrente: r.corrente ?? "",
  potencia: r.potencia ?? "",
  capacidadeBtu: r.capacidade_btu ?? "",
  contrato: r.contrato ?? "",
  planoManutencao: r.plano_manutencao ?? "",
  numeroAnvisa: r.numero_anvisa ?? "",
  fotoUrl: r.foto_url ?? "",
  manualUrl: r.manual_url ?? "",
});

const equipamentoToRow = (e: Partial<Omit<Equipamento, "id">>) => ({
  cliente_id: e.clienteId,
  cliente_nome: e.clienteNome,
  local_id: e.localId,
  local_descricao: e.localDescricao,
  pavimento_id: e.pavimentoId,
  pavimento_descricao: e.pavimentoDescricao,
  setor_id: e.setorId,
  setor_descricao: e.setorDescricao,
  situacao: e.situacao,
  tag: e.tag,
  equipamento: e.equipamento,
  serie: e.serie,
  grupo: e.grupo,
  subgrupo: e.subgrupo,
  modelo: e.modelo,
  valor: e.valor,
  fabricante: e.fabricante,
  data_aquisicao: e.dataAquisicao,
  nivel_risco: e.nivelRisco,
  nivel_manutencao: e.nivelManutencao,
  expectativa_vida: e.expectativaVida,
  data_garantia: e.dataGarantia,
  tensao: e.tensao,
  corrente: e.corrente,
  potencia: e.potencia,
  capacidade_btu: e.capacidadeBtu,
  contrato: e.contrato,
  plano_manutencao: e.planoManutencao,
  numero_anvisa: e.numeroAnvisa,
  foto_url: e.fotoUrl,
  manual_url: e.manualUrl,
});

export function EquipamentosProvider({ children }: { children: ReactNode }) {
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);

  const load = useCallback(async () => {
    const rows = await fetchAll("equipamentos");
    setEquipamentos(rows.map(rowToEquipamento));
  }, []);

  useEffect(() => { load(); }, [load]);

  const addEquipamento = async (e: Omit<Equipamento, "id">) => {
    const row = equipamentoToRow(e);
    const data = await insertRow("equipamentos", row);
    if (data) setEquipamentos(prev => [...prev, rowToEquipamento(data)]);
  };

  const updateEquipamento = async (id: string, e: Partial<Omit<Equipamento, "id">>) => {
    const row = equipamentoToRow(e);
    const ok = await updateRow("equipamentos", id, row);
    if (ok) setEquipamentos(prev => prev.map(eq => eq.id === id ? { ...eq, ...e } : eq));
  };

  const deleteEquipamento = async (id: string) => {
    const ok = await deleteRow("equipamentos", id);
    if (ok) setEquipamentos(prev => prev.filter(eq => eq.id !== id));
  };

  return (
    <EquipamentosContext.Provider value={{ equipamentos, addEquipamento, updateEquipamento, deleteEquipamento }}>
      {children}
    </EquipamentosContext.Provider>
  );
}

export function useEquipamentos() {
  const ctx = useContext(EquipamentosContext);
  if (!ctx) throw new Error("useEquipamentos must be used within EquipamentosProvider");
  return ctx;
}
