import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { fetchAll, insertRow, updateRow, deleteRow } from "@/lib/supabaseHelper";

export interface MaterialServico {
  id: string; codigo: string; descricao: string; tipo: "Material" | "Serviço";
  unidadeMedida: string; categoriaId: string; fabricanteId: string; estoqueMinimo: number;
  fotos: string[];
}

interface MateriaisServicosContextType {
  materiais: MaterialServico[];
  addMaterial: (m: Omit<MaterialServico, "id" | "codigo">) => void;
  updateMaterial: (id: string, data: Partial<Omit<MaterialServico, "id">>) => void;
  deleteMaterial: (id: string) => void;
}

const MateriaisServicosContext = createContext<MateriaisServicosContextType | undefined>(undefined);

const rowToMaterial = (r: any): MaterialServico => ({
  id: r.id, codigo: r.codigo ?? "", descricao: r.descricao ?? "",
  tipo: r.tipo ?? "Material", unidadeMedida: r.unidade_medida ?? "",
  categoriaId: r.categoria_id ?? "", fabricanteId: r.fabricante_id ?? "",
  estoqueMinimo: Number(r.estoque_minimo ?? 0),
  fotos: Array.isArray(r.fotos) ? r.fotos : [],
});

export function MateriaisServicosProvider({ children }: { children: ReactNode }) {
  const [materiais, setMateriais] = useState<MaterialServico[]>([]);

  const load = useCallback(async () => {
    const data = await fetchAll("materiais_servicos", "codigo");
    setMateriais(data.map(rowToMaterial));
  }, []);

  useEffect(() => { load(); }, [load]);

  const nextCodigo = () => {
    const nums = materiais.map(m => parseInt(m.codigo, 10)).filter(n => !isNaN(n));
    return String((nums.length > 0 ? Math.max(...nums) : 0) + 1).padStart(6, "0");
  };

  const addMaterial = async (m: Omit<MaterialServico, "id" | "codigo">) => {
    await insertRow("materiais_servicos", {
      codigo: nextCodigo(), descricao: m.descricao, tipo: m.tipo,
      unidade_medida: m.unidadeMedida, categoria_id: m.categoriaId, fabricante_id: m.fabricanteId,
      estoque_minimo: m.estoqueMinimo || 0,
    });
    await load();
  };

  const updateMaterial = async (id: string, data: Partial<Omit<MaterialServico, "id">>) => {
    const current = materiais.find(m => m.id === id);
    if (!current) return;
    const merged = { ...current, ...data };
    await updateRow("materiais_servicos", id, {
      codigo: merged.codigo, descricao: merged.descricao, tipo: merged.tipo,
      unidade_medida: merged.unidadeMedida, categoria_id: merged.categoriaId,
      fabricante_id: merged.fabricanteId, estoque_minimo: merged.estoqueMinimo,
    });
    await load();
  };

  const deleteMaterial = async (id: string) => { await deleteRow("materiais_servicos", id); await load(); };

  return (
    <MateriaisServicosContext.Provider value={{ materiais, addMaterial, updateMaterial, deleteMaterial }}>
      {children}
    </MateriaisServicosContext.Provider>
  );
}

export function useMateriaisServicos() {
  const ctx = useContext(MateriaisServicosContext);
  if (!ctx) throw new Error("useMateriaisServicos must be used within MateriaisServicosProvider");
  return ctx;
}
