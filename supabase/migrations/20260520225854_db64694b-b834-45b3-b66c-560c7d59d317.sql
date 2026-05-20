UPDATE public.perfis_acesso
SET permissoes = permissoes
  || jsonb_build_object(
    'eventograma', true,
    'eventograma.criar', true,
    'eventograma.editar', true,
    'eventograma.excluir', true,
    'eventograma.exportar_pdf', true,
    'eventograma.exportar_excel', true
  )
WHERE (permissoes->>'cronograma')::text = 'true';