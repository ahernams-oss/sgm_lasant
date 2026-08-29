CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  PERFORM cron.unschedule('cotacao-epis-vencendo-daily');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'cotacao-epis-vencendo-daily',
  '0 12 * * *',
  $$
  SELECT net.http_post(
    url := 'https://vdjezhhrnksluzealfcl.supabase.co/functions/v1/cotacao-epis-vencendo',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkamV6aGhybmtzbHV6ZWFsZmNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNDg4MDMsImV4cCI6MjA4OTYyNDgwM30.R9VdisaihqUktAQKw-EcnO6YM3yPvUg-bTDTHQefkqA'
    ),
    body := jsonb_build_object('source', 'cron')
  ) AS request_id;
  $$
);