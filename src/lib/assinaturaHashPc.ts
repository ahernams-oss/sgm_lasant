// Hash SHA-256 do conteúdo essencial do Pedido de Compra para garantir integridade
import type { PedidoCompra } from "@/contexts/PedidoCompraContext";

export async function gerarHashPc(p: Partial<PedidoCompra>): Promise<string> {
  const conteudo = JSON.stringify({
    numero: p.numero,
    cotacaoId: p.cotacaoId,
    requisicaoId: p.requisicaoId,
    requisicaoNumero: p.requisicaoNumero,
    dataCriacao: p.dataCriacao,
    comprador: p.comprador,
    fornecedorId: p.fornecedorId,
    fornecedorNome: p.fornecedorNome,
    itens: p.itens,
    condicaoPagamento: p.condicaoPagamento,
    prazoEntrega: p.prazoEntrega,
    localEntrega: p.localEntrega,
    observacoes: p.observacoes,
    valorTotal: p.valorTotal,
  });
  const buffer = new TextEncoder().encode(conteudo);
  const hash = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
