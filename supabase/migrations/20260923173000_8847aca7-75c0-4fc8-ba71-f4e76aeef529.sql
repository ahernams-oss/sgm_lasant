CREATE OR REPLACE FUNCTION public.gerar_contas_pagar_pedido(_pedido_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  p record; c text; dias int[]; n int; total numeric; vp numeric; base date; i int; v numeric;
BEGIN
  SELECT * INTO p FROM pedidos_compra WHERE id = _pedido_id;
  IF NOT FOUND OR coalesce(p.status,'') = 'Cancelado' THEN RETURN 0; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('cp_pedido_' || _pedido_id::text));
  IF EXISTS (SELECT 1 FROM fin_contas_pagar WHERE pedido_compra_id = _pedido_id) THEN RETURN 0; END IF;

  c := lower(trim(coalesce(p.condicao_pagamento,'')));
  IF c = '' OR c LIKE '%vista%' OR c = '0' THEN dias := ARRAY[0];
  ELSE
    SELECT array_agg(m[1]::int) INTO dias FROM regexp_matches(c, '\d+', 'g') m;
    IF dias IS NULL THEN dias := ARRAY[0];
    ELSIF NOT (c LIKE '%/%' OR array_length(dias,1) > 1) THEN dias := ARRAY[dias[1]];
    END IF;
  END IF;

  n := array_length(dias,1);
  total := coalesce(p.valor_total,0);
  vp := round(total / n, 2);
  base := coalesce(nullif(left(p.data_criacao::text,10),'')::date, current_date);

  FOR i IN 1..n LOOP
    v := CASE WHEN i = n THEN round(total - vp*(n-1), 2) ELSE vp END;
    INSERT INTO fin_contas_pagar (descricao, fornecedor_id, fornecedor_nome, valor_total, valor_pago,
      data_emissao, data_vencimento, status, parcela_num, parcela_total, observacao, pedido_compra_id, origem)
    VALUES ('OC-' || lpad(p.numero::text,4,'0') || ' ' || coalesce(p.fornecedor_nome,'') || CASE WHEN n>1 THEN ' ('||i||'/'||n||')' ELSE '' END,
      nullif(p.fornecedor_id::text,'')::uuid, coalesce(p.fornecedor_nome,''), v, 0,
      base, base + dias[i], 'aberta', i, n, nullif(p.observacoes,''), p.id, 'pedido_compra');
  END LOOP;
  RETURN n;
END $$;

CREATE OR REPLACE FUNCTION public.trg_pedido_gera_contas_pagar()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.gerar_contas_pagar_pedido(NEW.id);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_pedido_gera_contas_pagar ON public.pedidos_compra;
CREATE TRIGGER trg_pedido_gera_contas_pagar
AFTER INSERT OR UPDATE OF status, valor_total ON public.pedidos_compra
FOR EACH ROW EXECUTE FUNCTION public.trg_pedido_gera_contas_pagar();

REVOKE EXECUTE ON FUNCTION public.gerar_contas_pagar_pedido(uuid) FROM anon, authenticated, public;

SELECT public.gerar_contas_pagar_pedido(id) FROM public.pedidos_compra WHERE coalesce(status,'') <> 'Cancelado';