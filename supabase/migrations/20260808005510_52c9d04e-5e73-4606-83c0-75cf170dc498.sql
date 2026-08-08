REVOKE ALL ON public.usuarios_credenciais FROM anon, authenticated;
REVOKE ALL ON public.clientes_credenciais FROM anon, authenticated;
REVOKE ALL ON public.empresa_credenciais FROM anon, authenticated;

GRANT ALL ON public.usuarios_credenciais TO service_role;
GRANT ALL ON public.clientes_credenciais TO service_role;
GRANT ALL ON public.empresa_credenciais TO service_role;

ALTER TABLE public.usuarios_credenciais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes_credenciais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresa_credenciais ENABLE ROW LEVEL SECURITY;