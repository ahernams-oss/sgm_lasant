UPDATE public.perfis_acesso
SET permissoes = (
  COALESCE(permissoes, '{}'::jsonb)
  || jsonb_build_object(
    'dashboard_ssos.visualizar', COALESCE(permissoes->'dashboard_engenharia.visualizar', 'false'::jsonb),
    'dashboard_ssos.exportar_pdf', COALESCE(permissoes->'dashboard_engenharia.exportar_pdf', 'false'::jsonb),
    'dashboard_medicoes.visualizar', COALESCE(permissoes->'dashboard_engenharia.visualizar', 'false'::jsonb),
    'dashboard_medicoes.exportar_pdf', COALESCE(permissoes->'dashboard_engenharia.exportar_pdf', 'false'::jsonb)
  )
) - 'dashboard_engenharia.visualizar' - 'dashboard_engenharia.exportar_pdf' - 'dashboard_engenharia'
WHERE permissoes ?| array['dashboard_engenharia','dashboard_engenharia.visualizar','dashboard_engenharia.exportar_pdf'];