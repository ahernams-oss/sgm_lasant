REVOKE EXECUTE ON FUNCTION public.trg_pedido_gera_contas_pagar() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.gerar_contas_pagar_pedido(uuid) FROM anon, authenticated, public;