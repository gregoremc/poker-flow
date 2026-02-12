
-- Step 1: Create organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Step 2: Insert default organization
INSERT INTO public.organizations (id, name, slug) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Clube Padrão', 'default');

-- Step 3: Add organization_id to profiles
ALTER TABLE public.profiles ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- Step 4: Create get_user_org_id function
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() $$;

-- Step 5: Add organization_id to operational tables
ALTER TABLE public.players ADD COLUMN organization_id UUID REFERENCES public.organizations(id) DEFAULT public.get_user_org_id();
ALTER TABLE public.tables ADD COLUMN organization_id UUID REFERENCES public.organizations(id) DEFAULT public.get_user_org_id();
ALTER TABLE public.cash_sessions ADD COLUMN organization_id UUID REFERENCES public.organizations(id) DEFAULT public.get_user_org_id();
ALTER TABLE public.buy_ins ADD COLUMN organization_id UUID REFERENCES public.organizations(id) DEFAULT public.get_user_org_id();
ALTER TABLE public.cash_outs ADD COLUMN organization_id UUID REFERENCES public.organizations(id) DEFAULT public.get_user_org_id();
ALTER TABLE public.dealers ADD COLUMN organization_id UUID REFERENCES public.organizations(id) DEFAULT public.get_user_org_id();
ALTER TABLE public.dealer_tips ADD COLUMN organization_id UUID REFERENCES public.organizations(id) DEFAULT public.get_user_org_id();
ALTER TABLE public.credit_records ADD COLUMN organization_id UUID REFERENCES public.organizations(id) DEFAULT public.get_user_org_id();
ALTER TABLE public.rake_entries ADD COLUMN organization_id UUID REFERENCES public.organizations(id) DEFAULT public.get_user_org_id();
ALTER TABLE public.cancelled_buy_ins ADD COLUMN organization_id UUID REFERENCES public.organizations(id) DEFAULT public.get_user_org_id();
ALTER TABLE public.dealer_payouts ADD COLUMN organization_id UUID REFERENCES public.organizations(id) DEFAULT public.get_user_org_id();
ALTER TABLE public.payment_receipts ADD COLUMN organization_id UUID REFERENCES public.organizations(id) DEFAULT public.get_user_org_id();
ALTER TABLE public.player_attachments ADD COLUMN organization_id UUID REFERENCES public.organizations(id) DEFAULT public.get_user_org_id();
ALTER TABLE public.club_settings ADD COLUMN organization_id UUID REFERENCES public.organizations(id) DEFAULT public.get_user_org_id();
ALTER TABLE public.chip_types ADD COLUMN organization_id UUID REFERENCES public.organizations(id) DEFAULT public.get_user_org_id();
ALTER TABLE public.audit_logs ADD COLUMN organization_id UUID REFERENCES public.organizations(id) DEFAULT public.get_user_org_id();

-- Step 6: Backfill all existing data
UPDATE public.profiles SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE public.players SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE public.tables SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE public.cash_sessions SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE public.buy_ins SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE public.cash_outs SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE public.dealers SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE public.dealer_tips SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE public.credit_records SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE public.rake_entries SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE public.cancelled_buy_ins SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE public.dealer_payouts SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE public.payment_receipts SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE public.player_attachments SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE public.club_settings SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE public.chip_types SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE public.audit_logs SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;

-- Step 7: Update handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name, organization_id)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    (NEW.raw_user_meta_data->>'organization_id')::uuid
  );
  IF NEW.email = 'gregoremc@hotmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Step 8: Drop old policies
DROP POLICY IF EXISTS "Public access " ON public.players;
DROP POLICY IF EXISTS "Public access " ON public.tables;
DROP POLICY IF EXISTS "Public access " ON public.cash_sessions;
DROP POLICY IF EXISTS "Public access " ON public.buy_ins;
DROP POLICY IF EXISTS "Public access " ON public.cash_outs;
DROP POLICY IF EXISTS "Public access " ON public.dealers;
DROP POLICY IF EXISTS "Public access " ON public.dealer_tips;
DROP POLICY IF EXISTS "Public access " ON public.credit_records;
DROP POLICY IF EXISTS "Public access " ON public.rake_entries;
DROP POLICY IF EXISTS "Public access " ON public.cancelled_buy_ins;
DROP POLICY IF EXISTS "Public access " ON public.dealer_payouts;
DROP POLICY IF EXISTS "Public access " ON public.payment_receipts;
DROP POLICY IF EXISTS "Public access " ON public.player_attachments;
DROP POLICY IF EXISTS "Public access " ON public.club_settings;
DROP POLICY IF EXISTS "Public access " ON public.chip_types;
DROP POLICY IF EXISTS "Public access " ON public.audit_logs;

-- Step 9: Create org-scoped RLS policies
CREATE POLICY "Org isolation" ON public.players FOR ALL TO authenticated USING (organization_id = public.get_user_org_id()) WITH CHECK (organization_id = public.get_user_org_id());
CREATE POLICY "Org isolation" ON public.tables FOR ALL TO authenticated USING (organization_id = public.get_user_org_id()) WITH CHECK (organization_id = public.get_user_org_id());
CREATE POLICY "Org isolation" ON public.cash_sessions FOR ALL TO authenticated USING (organization_id = public.get_user_org_id()) WITH CHECK (organization_id = public.get_user_org_id());
CREATE POLICY "Org isolation" ON public.buy_ins FOR ALL TO authenticated USING (organization_id = public.get_user_org_id()) WITH CHECK (organization_id = public.get_user_org_id());
CREATE POLICY "Org isolation" ON public.cash_outs FOR ALL TO authenticated USING (organization_id = public.get_user_org_id()) WITH CHECK (organization_id = public.get_user_org_id());
CREATE POLICY "Org isolation" ON public.dealers FOR ALL TO authenticated USING (organization_id = public.get_user_org_id()) WITH CHECK (organization_id = public.get_user_org_id());
CREATE POLICY "Org isolation" ON public.dealer_tips FOR ALL TO authenticated USING (organization_id = public.get_user_org_id()) WITH CHECK (organization_id = public.get_user_org_id());
CREATE POLICY "Org isolation" ON public.credit_records FOR ALL TO authenticated USING (organization_id = public.get_user_org_id()) WITH CHECK (organization_id = public.get_user_org_id());
CREATE POLICY "Org isolation" ON public.rake_entries FOR ALL TO authenticated USING (organization_id = public.get_user_org_id()) WITH CHECK (organization_id = public.get_user_org_id());
CREATE POLICY "Org isolation" ON public.cancelled_buy_ins FOR ALL TO authenticated USING (organization_id = public.get_user_org_id()) WITH CHECK (organization_id = public.get_user_org_id());
CREATE POLICY "Org isolation" ON public.dealer_payouts FOR ALL TO authenticated USING (organization_id = public.get_user_org_id()) WITH CHECK (organization_id = public.get_user_org_id());
CREATE POLICY "Org isolation" ON public.payment_receipts FOR ALL TO authenticated USING (organization_id = public.get_user_org_id()) WITH CHECK (organization_id = public.get_user_org_id());
CREATE POLICY "Org isolation" ON public.player_attachments FOR ALL TO authenticated USING (organization_id = public.get_user_org_id()) WITH CHECK (organization_id = public.get_user_org_id());
CREATE POLICY "Org isolation" ON public.club_settings FOR ALL TO authenticated USING (organization_id = public.get_user_org_id()) WITH CHECK (organization_id = public.get_user_org_id());
CREATE POLICY "Org isolation" ON public.chip_types FOR ALL TO authenticated USING (organization_id = public.get_user_org_id()) WITH CHECK (organization_id = public.get_user_org_id());
CREATE POLICY "Org isolation" ON public.audit_logs FOR ALL TO authenticated USING (organization_id = public.get_user_org_id()) WITH CHECK (organization_id = public.get_user_org_id());

-- Step 10: Organizations table RLS
CREATE POLICY "Users can view own org" ON public.organizations FOR SELECT TO authenticated USING (id = public.get_user_org_id());
