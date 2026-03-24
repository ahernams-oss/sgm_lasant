import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { fetchAll, insertRow, updateRow, deleteRow } from "@/lib/supabaseHelper";

export interface GrupoCompras { id: string; codigo: string; nome: string; }
export interface SubGrupoCompras { id: string; grupoId: string; codigo: string; nome: string; }
export interface ClasseCompras { id: string; subGrupoId: string; codigo: string; nome: string; }
export interface CategoriasComprasData { grupos: GrupoCompras[]; subGrupos: SubGrupoCompras[]; classes: ClasseCompras[]; }

interface CategoriasComprasContextType {
  grupos: GrupoCompras[]; subGrupos: SubGrupoCompras[]; classes: ClasseCompras[];
  addGrupo: (g: Omit<GrupoCompras, "id">) => void;
  updateGrupo: (id: string, data: Partial<Omit<GrupoCompras, "id">>) => void;
  deleteGrupo: (id: string) => void;
  addSubGrupo: (s: Omit<SubGrupoCompras, "id">) => void;
  updateSubGrupo: (id: string, data: Partial<Omit<SubGrupoCompras, "id">>) => void;
  deleteSubGrupo: (id: string) => void;
  addClasse: (c: Omit<ClasseCompras, "id">) => void;
  updateClasse: (id: string, data: Partial<Omit<ClasseCompras, "id">>) => void;
  deleteClasse: (id: string) => void;
  getCodigoCompleto: (classeId: string) => string;
  getDescricaoCompleta: (classeId: string) => string;
}

const CategoriasComprasContext = createContext<CategoriasComprasContextType | undefined>(undefined);

export function CategoriasComprasProvider({ children }: { children: ReactNode }) {
  const [grupos, setGrupos] = useState<GrupoCompras[]>([]);
  const [subGrupos, setSubGrupos] = useState<SubGrupoCompras[]>([]);
  const [classes, setClasses] = useState<ClasseCompras[]>([]);

  const loadAll = useCallback(async () => {
    const [g, s, c] = await Promise.all([
      fetchAll("categorias_compras_grupos", "codigo"),
      fetchAll("categorias_compras_subgrupos", "codigo"),
      fetchAll("categorias_compras_classes", "codigo"),
    ]);
    setGrupos(g.map((r: any) => ({ id: r.id, codigo: r.codigo ?? "", nome: r.nome ?? "" })));
    setSubGrupos(s.map((r: any) => ({ id: r.id, grupoId: r.grupo_id ?? "", codigo: r.codigo ?? "", nome: r.nome ?? "" })));
    setClasses(c.map((r: any) => ({ id: r.id, subGrupoId: r.sub_grupo_id ?? "", codigo: r.codigo ?? "", nome: r.nome ?? "" })));
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const addGrupo = async (g: Omit<GrupoCompras, "id">) => {
    await insertRow("categorias_compras_grupos", { codigo: g.codigo, nome: g.nome });
    await loadAll();
  };
  const updateGrupo = async (id: string, data: Partial<Omit<GrupoCompras, "id">>) => {
    await updateRow("categorias_compras_grupos", id, data);
    await loadAll();
  };
  const deleteGrupo = async (id: string) => {
    // Delete children
    const subIds = subGrupos.filter(s => s.grupoId === id).map(s => s.id);
    for (const cid of classes.filter(c => subIds.includes(c.subGrupoId)).map(c => c.id)) {
      await deleteRow("categorias_compras_classes", cid);
    }
    for (const sid of subIds) {
      await deleteRow("categorias_compras_subgrupos", sid);
    }
    await deleteRow("categorias_compras_grupos", id);
    await loadAll();
  };

  const addSubGrupo = async (s: Omit<SubGrupoCompras, "id">) => {
    await insertRow("categorias_compras_subgrupos", { grupo_id: s.grupoId, codigo: s.codigo, nome: s.nome });
    await loadAll();
  };
  const updateSubGrupo = async (id: string, data: Partial<Omit<SubGrupoCompras, "id">>) => {
    const row: any = {};
    if (data.grupoId !== undefined) row.grupo_id = data.grupoId;
    if (data.codigo !== undefined) row.codigo = data.codigo;
    if (data.nome !== undefined) row.nome = data.nome;
    await updateRow("categorias_compras_subgrupos", id, row);
    await loadAll();
  };
  const deleteSubGrupo = async (id: string) => {
    for (const cid of classes.filter(c => c.subGrupoId === id).map(c => c.id)) {
      await deleteRow("categorias_compras_classes", cid);
    }
    await deleteRow("categorias_compras_subgrupos", id);
    await loadAll();
  };

  const addClasse = async (c: Omit<ClasseCompras, "id">) => {
    await insertRow("categorias_compras_classes", { sub_grupo_id: c.subGrupoId, codigo: c.codigo, nome: c.nome });
    await loadAll();
  };
  const updateClasse = async (id: string, data: Partial<Omit<ClasseCompras, "id">>) => {
    const row: any = {};
    if (data.subGrupoId !== undefined) row.sub_grupo_id = data.subGrupoId;
    if (data.codigo !== undefined) row.codigo = data.codigo;
    if (data.nome !== undefined) row.nome = data.nome;
    await updateRow("categorias_compras_classes", id, row);
    await loadAll();
  };
  const deleteClasse = async (id: string) => {
    await deleteRow("categorias_compras_classes", id);
    await loadAll();
  };

  const getCodigoCompleto = (classeId: string): string => {
    const classe = classes.find(c => c.id === classeId);
    if (!classe) return "";
    const sub = subGrupos.find(s => s.id === classe.subGrupoId);
    if (!sub) return classe.codigo;
    const grupo = grupos.find(g => g.id === sub.grupoId);
    if (!grupo) return `${sub.codigo}.${classe.codigo}`;
    return `${grupo.codigo}.${sub.codigo}.${classe.codigo}`;
  };

  const getDescricaoCompleta = (classeId: string): string => {
    const classe = classes.find(c => c.id === classeId);
    if (!classe) return "";
    return `${getCodigoCompleto(classeId)} - ${classe.nome}`;
  };

  return (
    <CategoriasComprasContext.Provider value={{
      grupos, subGrupos, classes,
      addGrupo, updateGrupo, deleteGrupo,
      addSubGrupo, updateSubGrupo, deleteSubGrupo,
      addClasse, updateClasse, deleteClasse,
      getCodigoCompleto, getDescricaoCompleta,
    }}>
      {children}
    </CategoriasComprasContext.Provider>
  );
}

export function useCategoriasCompras() {
  const ctx = useContext(CategoriasComprasContext);
  if (!ctx) throw new Error("useCategoriasCompras must be used within CategoriasComprasProvider");
  return ctx;
}
