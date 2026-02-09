
-- Add session_id to tables (links each table to a cash session)
ALTER TABLE public.tables 
ADD COLUMN session_id uuid REFERENCES public.cash_sessions(id) ON DELETE CASCADE;

-- Add responsible field to cash_sessions
ALTER TABLE public.cash_sessions 
ADD COLUMN responsible text;
