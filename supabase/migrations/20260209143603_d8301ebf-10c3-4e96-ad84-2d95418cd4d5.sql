-- Drop the unique constraint on session_date to allow multiple sessions per day
ALTER TABLE public.cash_sessions DROP CONSTRAINT IF EXISTS cash_sessions_session_date_key;

-- Clean up orphaned tables without session_id (set them inactive)
UPDATE public.tables SET is_active = false WHERE session_id IS NULL;