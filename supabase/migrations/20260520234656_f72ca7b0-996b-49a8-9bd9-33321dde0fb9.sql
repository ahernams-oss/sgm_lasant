UPDATE public.perfis_acesso
SET permissoes = permissoes || jsonb_build_object('requisicao_colaboradores.status.suspensa', true)
WHERE (permissoes->>'requisicao_colaboradores.status.aprovada')::boolean IS TRUE;