-- 1) Remove duplicados por requisição, mantendo o registro com mais candidatos (empate: mais antigo)
WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY requisicao_id
           ORDER BY jsonb_array_length(COALESCE(candidatos, '[]'::jsonb)) DESC, created_at ASC
         ) AS rn
  FROM public.processos_seletivos
  WHERE requisicao_id IS NOT NULL
)
DELETE FROM public.processos_seletivos p
USING ranked r
WHERE p.id = r.id AND r.rn > 1;

-- 2) Evita novas duplicidades
CREATE UNIQUE INDEX IF NOT EXISTS processos_seletivos_requisicao_id_key
  ON public.processos_seletivos (requisicao_id)
  WHERE requisicao_id IS NOT NULL;