
-- Remove "Public access" policies that bypass org isolation on ALL tables
DROP POLICY IF EXISTS "Public access" ON public.players;
DROP POLICY IF EXISTS "Public access" ON public.tables;
DROP POLICY IF EXISTS "Public access" ON public.cash_sessions;
DROP POLICY IF EXISTS "Public access" ON public.buy_ins;
DROP POLICY IF EXISTS "Public access" ON public.cash_outs;
DROP POLICY IF EXISTS "Public access" ON public.dealers;
DROP POLICY IF EXISTS "Public access" ON public.dealer_tips;
DROP POLICY IF EXISTS "Public access" ON public.dealer_payouts;
DROP POLICY IF EXISTS "Public access" ON public.rake_entries;
DROP POLICY IF EXISTS "Public access" ON public.credit_records;
DROP POLICY IF EXISTS "Public access" ON public.chip_types;
DROP POLICY IF EXISTS "Public access" ON public.club_settings;
DROP POLICY IF EXISTS "Public access" ON public.audit_logs;
DROP POLICY IF EXISTS "Public access" ON public.cancelled_buy_ins;
DROP POLICY IF EXISTS "Public access" ON public.payment_receipts;
DROP POLICY IF EXISTS "Public access" ON public.player_attachments;

-- Change "Org isolation" from RESTRICTIVE to PERMISSIVE on all tables
-- (restrictive without a permissive policy = deny all)
DROP POLICY IF EXISTS "Org isolation" ON public.players;
CREATE POLICY "Org isolation" ON public.players FOR ALL USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org isolation" ON public.tables;
CREATE POLICY "Org isolation" ON public.tables FOR ALL USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org isolation" ON public.cash_sessions;
CREATE POLICY "Org isolation" ON public.cash_sessions FOR ALL USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org isolation" ON public.buy_ins;
CREATE POLICY "Org isolation" ON public.buy_ins FOR ALL USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org isolation" ON public.cash_outs;
CREATE POLICY "Org isolation" ON public.cash_outs FOR ALL USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org isolation" ON public.dealers;
CREATE POLICY "Org isolation" ON public.dealers FOR ALL USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org isolation" ON public.dealer_tips;
CREATE POLICY "Org isolation" ON public.dealer_tips FOR ALL USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org isolation" ON public.dealer_payouts;
CREATE POLICY "Org isolation" ON public.dealer_payouts FOR ALL USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org isolation" ON public.rake_entries;
CREATE POLICY "Org isolation" ON public.rake_entries FOR ALL USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org isolation" ON public.credit_records;
CREATE POLICY "Org isolation" ON public.credit_records FOR ALL USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org isolation" ON public.chip_types;
CREATE POLICY "Org isolation" ON public.chip_types FOR ALL USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org isolation" ON public.club_settings;
CREATE POLICY "Org isolation" ON public.club_settings FOR ALL USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org isolation" ON public.audit_logs;
CREATE POLICY "Org isolation" ON public.audit_logs FOR ALL USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org isolation" ON public.cancelled_buy_ins;
CREATE POLICY "Org isolation" ON public.cancelled_buy_ins FOR ALL USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org isolation" ON public.payment_receipts;
CREATE POLICY "Org isolation" ON public.payment_receipts FOR ALL USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org isolation" ON public.player_attachments;
CREATE POLICY "Org isolation" ON public.player_attachments FOR ALL USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id());
