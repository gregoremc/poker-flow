-- Allow users to update their own organization (for logo_url)
CREATE POLICY "Users can update own org"
ON public.organizations
FOR UPDATE
USING (id = get_user_org_id())
WITH CHECK (id = get_user_org_id());
