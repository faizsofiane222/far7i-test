-- Add tables to the supabase_realtime publication to ensure events are broadcast
-- This is often required for the client (browser) to receive 'postgres_changes' events
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.messages, public.conversations;
COMMIT;
