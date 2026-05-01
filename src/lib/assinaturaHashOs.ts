// Geração de hash SHA-256 do conteúdo essencial da OS para garantir integridade
import type { OrdemServico } from "@/contexts/OrdensServicoContext";

export async function gerarHashOs(os: Partial<OrdemServico>): Promise<string> {
  const conteudo = JSON.stringify({
    numero: os.numero,
    solicitacaoNumero: os.solicitacaoNumero,
    clienteId: os.clienteId,
    clienteNome: os.clienteNome,
    situacao: os.situacao,
    dataInicio: os.dataInicio,
    dataTermino: os.dataTermino,
    prioridade: os.prioridade,
    solicitante: os.solicitante,
    matricula: os.matricula,
    localDescricao: os.localDescricao,
    pavimentoDescricao: os.pavimentoDescricao,
    setorDescricao: os.setorDescricao,
    categoria: os.categoria,
    servico: os.servico,
    descricaoServicos: os.descricaoServicos,
    descricaoConclusao: os.descricaoConclusao,
    materiais: os.materiais,
    materiaisEstoque: os.materiaisEstoque,
    profissionais: os.profissionais,
    bdi: os.bdi,
    tipoOs: os.tipoOs,
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
