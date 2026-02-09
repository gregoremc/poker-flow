
-- Add table_id to dealer_tips for linking tips to specific tables
ALTER TABLE public.dealer_tips 
ADD COLUMN table_id uuid REFERENCES public.tables(id) ON DELETE SET NULL;

-- Create cancelled_buy_ins table to track deleted buy-ins for reporting
CREATE TABLE public.cancelled_buy_ins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_buy_in_id uuid,
  player_id uuid NOT NULL,
  player_name text NOT NULL,
  table_id uuid,
  table_name text,
  session_id uuid REFERENCES public.cash_sessions(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_method text NOT NULL,
  cancelled_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cancelled_buy_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access" ON public.cancelled_buy_ins
FOR ALL USING (true) WITH CHECK (true);
