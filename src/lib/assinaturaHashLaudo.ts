// Geração de hash SHA-256 do conteúdo essencial do Laudo de Condenação
import type { LaudoCondenacao } from "@/contexts/LaudosCondenacaoContext";

export async function gerarHashLaudo(l: Partial<LaudoCondenacao>): Promise<string> {
  const conteudo = JSON.stringify({
    numero: l.numero,
    equipamento_id: l.equipamento_id,
    equipamento_tag: l.equipamento_tag,
    equipamento_nome: l.equipamento_nome,
    tipo: l.tipo,
    marca: l.marca,
    modelo: l.modelo,
    serie: l.serie,
    patrimonio: l.patrimonio,
    ano_fabricacao: l.ano_fabricacao,
    data_aquisicao: l.data_aquisicao,
    localizacao: l.localizacao,
    estado_conservacao: l.estado_conservacao,
    data_emissao: l.data_emissao,
    data_inspecao: l.data_inspecao,
    local_inspecao: l.local_inspecao,
    responsavel_tecnico: l.responsavel_tecnico,
    registro_profissional: l.registro_profissional,
    historico: l.historico,
    insp_condicoes_fisicas: l.insp_condicoes_fisicas,
    insp_condicoes_eletricas: l.insp_condicoes_eletricas,
    insp_condicoes_mecanicas: l.insp_condicoes_mecanicas,
    insp_funcionalidade: l.insp_funcionalidade,
    motivos_condenacao: l.motivos_condenacao,
    custo_reparo: l.custo_reparo,
    valor_residual: l.valor_residual,
    valor_novo_equivalente: l.valor_novo_equivalente,
    parecer: l.parecer,
    conclusao_condicoes: l.conclusao_condicoes,
  });
  const buffer = new TextEncoder().encode(conteudo);
  const hash = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function obterIpOrigem(): Promise<string> {
  try {
    const r = await fetch("https://api.ipify.org?format=json");
    const j = await r.json();
    return j.ip || "";
  } catch {
    return "";
  }
}
