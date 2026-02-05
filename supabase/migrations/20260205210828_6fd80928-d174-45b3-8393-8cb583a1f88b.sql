-- =====================================================
-- POKER CLUB MANAGEMENT SYSTEM - COMPLETE SCHEMA
-- =====================================================

-- 1. Club Settings (Logo, Name, Global Configurations)
CREATE TABLE public.club_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_name TEXT NOT NULL DEFAULT 'Poker Club',
  logo_url TEXT,
  credit_limit_per_player DECIMAL(10,2) NOT NULL DEFAULT 500.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default settings
INSERT INTO public.club_settings (club_name) VALUES ('Poker Club');

-- 2. Players Table
CREATE TABLE public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  credit_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  credit_limit DECIMAL(10,2) NOT NULL DEFAULT 500.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Dealers Table
CREATE TABLE public.dealers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  total_tips DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Tables (Mesas)
CREATE TABLE public.tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Chip Inventory Types
CREATE TABLE public.chip_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  color TEXT NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default chip types
INSERT INTO public.chip_types (color, value, sort_order) VALUES
  ('Branca', 5, 1),
  ('Vermelha', 10, 2),
  ('Verde', 25, 3),
  ('Azul', 50, 4),
  ('Preta', 100, 5),
  ('Roxa', 500, 6),
  ('Laranja', 1000, 7);

-- 6. Daily Cash Sessions (Caixa do Dia)
CREATE TABLE public.cash_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_date DATE NOT NULL,
  is_open BOOLEAN NOT NULL DEFAULT true,
  initial_chip_inventory JSONB DEFAULT '{}',
  final_chip_inventory JSONB,
  notes TEXT,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_date)
);

-- 7. Payment Method Enum
CREATE TYPE public.payment_method AS ENUM ('pix', 'cash', 'debit', 'credit', 'credit_fiado', 'bonus');

-- 8. Buy-ins
CREATE TABLE public.buy_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES public.tables(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.cash_sessions(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method public.payment_method NOT NULL,
  is_bonus BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Cash-outs
CREATE TABLE public.cash_outs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES public.tables(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.cash_sessions(id) ON DELETE CASCADE,
  chip_value DECIMAL(10,2) NOT NULL,
  total_buy_in DECIMAL(10,2) NOT NULL,
  profit DECIMAL(10,2) NOT NULL,
  payment_method public.payment_method NOT NULL DEFAULT 'cash',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Dealer Tips (Caixinhas)
CREATE TABLE public.dealer_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID REFERENCES public.dealers(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.cash_sessions(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Credit/Fiado Records
CREATE TABLE public.credit_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
  buy_in_id UUID REFERENCES public.buy_ins(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_buy_ins_table ON public.buy_ins(table_id);
CREATE INDEX idx_buy_ins_player ON public.buy_ins(player_id);
CREATE INDEX idx_buy_ins_session ON public.buy_ins(session_id);
CREATE INDEX idx_buy_ins_created ON public.buy_ins(created_at);
CREATE INDEX idx_cash_outs_table ON public.cash_outs(table_id);
CREATE INDEX idx_cash_outs_player ON public.cash_outs(player_id);
CREATE INDEX idx_cash_outs_session ON public.cash_outs(session_id);
CREATE INDEX idx_dealer_tips_dealer ON public.dealer_tips(dealer_id);
CREATE INDEX idx_dealer_tips_session ON public.dealer_tips(session_id);
CREATE INDEX idx_credit_records_player ON public.credit_records(player_id);
CREATE INDEX idx_cash_sessions_date ON public.cash_sessions(session_date);

-- =====================================================
-- UPDATE TIMESTAMP FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply triggers
CREATE TRIGGER update_club_settings_updated_at
  BEFORE UPDATE ON public.club_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON public.players
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dealers_updated_at
  BEFORE UPDATE ON public.dealers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tables_updated_at
  BEFORE UPDATE ON public.tables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cash_sessions_updated_at
  BEFORE UPDATE ON public.cash_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- FUNCTION TO UPDATE PLAYER CREDIT BALANCE
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_player_credit_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.players
    SET credit_balance = credit_balance + NEW.amount
    WHERE id = NEW.player_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.is_paid = false AND NEW.is_paid = true THEN
    UPDATE public.players
    SET credit_balance = credit_balance - NEW.amount
    WHERE id = NEW.player_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_credit_balance
  AFTER INSERT OR UPDATE ON public.credit_records
  FOR EACH ROW EXECUTE FUNCTION public.update_player_credit_balance();

-- =====================================================
-- FUNCTION TO UPDATE DEALER TIPS TOTAL
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_dealer_tips_total()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.dealers
    SET total_tips = total_tips + NEW.amount
    WHERE id = NEW.dealer_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.dealers
    SET total_tips = total_tips - OLD.amount
    WHERE id = OLD.dealer_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_dealer_tips
  AFTER INSERT OR DELETE ON public.dealer_tips
  FOR EACH ROW EXECUTE FUNCTION public.update_dealer_tips_total();

-- =====================================================
-- RLS POLICIES (Public access for local/kiosk operation)
-- =====================================================
ALTER TABLE public.club_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chip_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buy_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_outs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_records ENABLE ROW LEVEL SECURITY;

-- Public read/write access (for local kiosk/terminal operation)
CREATE POLICY "Public access" ON public.club_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON public.players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON public.dealers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON public.tables FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON public.chip_types FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON public.cash_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON public.buy_ins FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON public.cash_outs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON public.dealer_tips FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON public.credit_records FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- STORAGE BUCKET FOR LOGOS
-- =====================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('club-assets', 'club-assets', true);

CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'club-assets');

CREATE POLICY "Public upload access"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'club-assets');

CREATE POLICY "Public update access"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'club-assets');

CREATE POLICY "Public delete access"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'club-assets');