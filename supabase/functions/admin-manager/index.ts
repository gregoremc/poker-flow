import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Verify caller is admin
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: { user: caller } } = await supabaseAdmin.auth.getUser(token);
  if (!caller) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Check admin role
  const { data: roleData } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", caller.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!roleData) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    if (action === "list-orgs") {
      const { data, error } = await supabaseAdmin.from("organizations").select("*").order("created_at");
      if (error) throw error;
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "create-org") {
      const { name, slug } = await req.json();
      const { data, error } = await supabaseAdmin.from("organizations").insert([{ name, slug }]).select().single();
      if (error) throw error;
      // Auto-create club_settings for this org
      await supabaseAdmin.from("club_settings").insert([{ club_name: name, organization_id: data.id }]);
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "create-user") {
      const { email, password, organization_id, display_name } = await req.json();
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { organization_id, display_name },
      });
      if (error) throw error;
      return new Response(JSON.stringify({ id: data.user.id, email: data.user.email }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "list-users") {
      const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
      if (error) throw error;
      // Get profiles with org info
      const { data: profiles } = await supabaseAdmin.from("profiles").select("*, organization:organizations(name)");
      const enriched = users.users.map(u => {
        const profile = profiles?.find(p => p.user_id === u.id);
        return {
          id: u.id,
          email: u.email,
          display_name: profile?.display_name,
          organization_name: profile?.organization?.name,
          organization_id: profile?.organization_id,
          created_at: u.created_at,
        };
      });
      return new Response(JSON.stringify(enriched), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
