DELETE FROM public.comunicacao_avisos_leitura a
USING public.comunicacao_avisos_leitura b
WHERE a.id > b.id
  AND a.aviso_id = b.aviso_id
  AND a.usuario_email IS NOT DISTINCT FROM b.usuario_email;

ALTER TABLE public.comunicacao_avisos_leitura ADD CONSTRAINT comunicacao_avisos_leitura_aviso_usuario_unique UNIQUE (aviso_id, usuario_email);