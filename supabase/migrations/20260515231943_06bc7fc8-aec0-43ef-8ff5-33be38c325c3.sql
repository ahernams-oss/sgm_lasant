
ALTER TABLE public.juridico_parcelas
  ADD COLUMN IF NOT EXISTS notificado_3d boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notificado_1d boolean NOT NULL DEFAULT false;

-- Garante extensões
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove agendamento anterior se existir
DO $$
BEGIN
  PERFORM cron.unschedule('check-parcelas-vencimento-daily');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Agenda diariamente às 13:30 UTC (= 10:30 BRT)
SELECT cron.schedule(
  'check-parcelas-vencimento-daily',
  '30 13 * * *',
  $$
  SELECT net.http_post(
    url := 'https://vdjezhhrnksluzealfcl.supabase.co/functions/v1/check-parcelas-vencimento',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkamV6aGhybmtzbHV6ZWFsZmNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNDg4MDMsImV4cCI6MjA4OTYyNDgwM30.R9VdisaihqUktAQKw-EcnO6YM3yPvUg-bTDTHQefkqA'
    ),
    body := jsonb_build_object('source', 'cron')
  ) AS request_id;
  $$
);
