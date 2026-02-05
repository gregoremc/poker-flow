-- Create rake_entries table for tracking house commission
CREATE TABLE public.rake_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id UUID NOT NULL REFERENCES public.tables(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.cash_sessions(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rake_entries ENABLE ROW LEVEL SECURITY;

-- Create public access policy
CREATE POLICY "Public access" ON public.rake_entries FOR ALL USING (true) WITH CHECK (true);

-- Create payment_receipts table for tracking credit payments
CREATE TABLE public.payment_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  credit_record_id UUID NOT NULL REFERENCES public.credit_records(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_method payment_method NOT NULL,
  session_id UUID REFERENCES public.cash_sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;

-- Create public access policy
CREATE POLICY "Public access" ON public.payment_receipts FOR ALL USING (true) WITH CHECK (true);

-- Create dealer_payouts table for tracking dealer tip payouts
CREATE TABLE public.dealer_payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_id UUID NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.cash_sessions(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  payment_method payment_method NOT NULL DEFAULT 'cash',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dealer_payouts ENABLE ROW LEVEL SECURITY;

-- Create public access policy
CREATE POLICY "Public access" ON public.dealer_payouts FOR ALL USING (true) WITH CHECK (true);

-- Update trigger to reset dealer tips after payout
CREATE OR REPLACE FUNCTION public.process_dealer_payout()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE public.dealers
  SET total_tips = total_tips - NEW.amount
  WHERE id = NEW.dealer_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_dealer_payout
  AFTER INSERT ON public.dealer_payouts
  FOR EACH ROW
  EXECUTE FUNCTION public.process_dealer_payout();