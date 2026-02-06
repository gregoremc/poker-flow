-- Add name column to cash_sessions for multiple sessions per day
ALTER TABLE public.cash_sessions 
ADD COLUMN name TEXT NOT NULL DEFAULT 'Sessão Principal';

-- Drop existing foreign keys and recreate with CASCADE
ALTER TABLE public.buy_ins 
DROP CONSTRAINT IF EXISTS buy_ins_session_id_fkey;

ALTER TABLE public.buy_ins 
ADD CONSTRAINT buy_ins_session_id_fkey 
FOREIGN KEY (session_id) REFERENCES public.cash_sessions(id) ON DELETE CASCADE;

ALTER TABLE public.cash_outs 
DROP CONSTRAINT IF EXISTS cash_outs_session_id_fkey;

ALTER TABLE public.cash_outs 
ADD CONSTRAINT cash_outs_session_id_fkey 
FOREIGN KEY (session_id) REFERENCES public.cash_sessions(id) ON DELETE CASCADE;

ALTER TABLE public.rake_entries 
DROP CONSTRAINT IF EXISTS rake_entries_session_id_fkey;

ALTER TABLE public.rake_entries 
ADD CONSTRAINT rake_entries_session_id_fkey 
FOREIGN KEY (session_id) REFERENCES public.cash_sessions(id) ON DELETE CASCADE;

ALTER TABLE public.dealer_tips 
DROP CONSTRAINT IF EXISTS dealer_tips_session_id_fkey;

ALTER TABLE public.dealer_tips 
ADD CONSTRAINT dealer_tips_session_id_fkey 
FOREIGN KEY (session_id) REFERENCES public.cash_sessions(id) ON DELETE CASCADE;

ALTER TABLE public.dealer_payouts 
DROP CONSTRAINT IF EXISTS dealer_payouts_session_id_fkey;

ALTER TABLE public.dealer_payouts 
ADD CONSTRAINT dealer_payouts_session_id_fkey 
FOREIGN KEY (session_id) REFERENCES public.cash_sessions(id) ON DELETE CASCADE;

ALTER TABLE public.payment_receipts 
DROP CONSTRAINT IF EXISTS payment_receipts_session_id_fkey;

ALTER TABLE public.payment_receipts 
ADD CONSTRAINT payment_receipts_session_id_fkey 
FOREIGN KEY (session_id) REFERENCES public.cash_sessions(id) ON DELETE CASCADE;