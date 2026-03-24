import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Generic helper to create a Supabase-backed CRUD context.
 * Handles fetch, add, update, delete with error toasts.
 */
export async function fetchAll<T>(table: string, orderBy = "created_at"): Promise<T[]> {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .order(orderBy, { ascending: true });
  if (error) {
    console.error(`Erro ao carregar ${table}:`, error);
    toast.error(`Erro ao carregar dados.`);
    return [];
  }
  return (data || []) as T[];
}

export async function insertRow(table: string, row: any): Promise<any> {
  const { data, error } = await supabase.from(table).insert(row).select().single();
  if (error) {
    console.error(`Erro ao inserir em ${table}:`, error);
    toast.error(`Erro ao salvar dados.`);
    return null;
  }
  return data;
}

export async function updateRow(table: string, id: string, row: any): Promise<boolean> {
  const { error } = await supabase.from(table).update(row).eq("id", id);
  if (error) {
    console.error(`Erro ao atualizar ${table}:`, error);
    toast.error(`Erro ao atualizar dados.`);
    return false;
  }
  return true;
}

export async function deleteRow(table: string, id: string): Promise<boolean> {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) {
    console.error(`Erro ao remover de ${table}:`, error);
    toast.error(`Erro ao remover dados.`);
    return false;
  }
  return true;
}
