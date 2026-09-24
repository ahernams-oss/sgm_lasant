import type { OsModelo } from "@/contexts/OsModelosContext";

const getXLSX = async () => await import("xlsx");

export const OS_MODELOS_FORMATO = "sgm.os_modelos";
export const OS_MODELOS_VERSAO = 1;

const baixar = (blob: Blob, nome: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nome; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const stamp = () => new Date().toISOString().slice(0, 10);

/** Exporta em JSON padronizado (formato + versão) para leitura por sistemas similares. */
export function exportarModelosJson(modelos: OsModelo[]) {
  const payload = {
    formato: OS_MODELOS_FORMATO,
    versao: OS_MODELOS_VERSAO,
    origem: "SGM Lasant",
    exportado_em: new Date().toISOString(),
    total: modelos.length,
    modelos: modelos.map((m) => ({ nome: m.nome, descricao: m.descricao || "" })),
  };
  baixar(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }), `modelos_os_${stamp()}.json`);
}

export async function exportarModelosExcel(modelos: OsModelo[]) {
  const X = await getXLSX();
  const ws = X.utils.aoa_to_sheet([["nome", "descricao"], ...modelos.map((m) => [m.nome, m.descricao || ""])]);
  ws["!cols"] = [{ wch: 30 }, { wch: 80 }];
  const wb = X.utils.book_new();
  X.utils.book_append_sheet(wb, ws, "Modelos_OS");
  X.writeFile(wb, `modelos_os_${stamp()}.xlsx`, { compression: true });
}

/** Lê JSON (formato SGM ou array simples), XLSX ou CSV com colunas nome/descricao. */
export async function lerArquivoModelos(file: File): Promise<{ nome: string; descricao: string }[]> {
  const ext = file.name.toLowerCase().split(".").pop();
  let rows: any[] = [];
  if (ext === "json") {
    const data = JSON.parse(await file.text());
    rows = Array.isArray(data) ? data : Array.isArray(data?.modelos) ? data.modelos : [];
  } else {
    const X = await getXLSX();
    const wb = X.read(await file.arrayBuffer(), { type: "array" });
    rows = X.utils.sheet_to_json<any>(wb.Sheets[wb.SheetNames[0]], { defval: "" });
  }
  const pick = (r: any, k: string) => {
    const key = Object.keys(r || {}).find((x) => x.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").startsWith(k));
    return key ? String(r[key] ?? "").trim() : "";
  };
  return rows
    .map((r) => ({ nome: pick(r, "nome") || pick(r, "name"), descricao: pick(r, "descr") || pick(r, "description") }))
    .filter((r) => r.nome);
}
