// supabase/functions/corporate-account-create/index.ts
//
// Admin-only edge function to create a corporate portal account.
// Creates a Supabase Auth user, sets their profile role to 'corporate',
// and inserts a record into corporate_accounts with the commission %.
//
// Request body:
// {
//   "email": "travel@acmecorp.com",
//   "password": "SecurePass123!",
//   "company_name": "Acme Corp",
//   "contact_name": "Jane Smith",      // optional
//   "commission_pct": 10,              // optional, default 0
//   "notes": "Signed agreement 2026"   // optional
// }

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Use POST" }, 405);

  const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Verify caller is admin
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return jsonResponse({ error: "Unauthorized" }, 401);

  const token = authHeader.replace("Bearer ", "");
  const { data: { user: callerUser }, error: authError } = await adminSupabase.auth.getUser(token);
  if (authError || !callerUser) return jsonResponse({ error: "Unauthorized" }, 401);

  const { data: callerProfile } = await adminSupabase
    .from("profiles")
    .select("role")
    .eq("id", callerUser.id)
    .single();

  if (callerProfile?.role !== "admin") return jsonResponse({ error: "Admin access required" }, 403);

  let body: {
    email?: string;
    password?: string;
    company_name?: string;
    contact_name?: string;
    commission_pct?: number;
    notes?: string;
  };
  try { body = await req.json(); } catch { return jsonResponse({ error: "Invalid JSON" }, 400); }

  const { email, password, company_name, contact_name, commission_pct = 0, notes } = body;
  if (!email || !password || !company_name) {
    return jsonResponse({ error: "email, password, and company_name are required" }, 400);
  }

  // Create Supabase auth user
  const { data: newUserData, error: createError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { account_type: "corporate", company_name },
  });
  if (createError) return jsonResponse({ error: createError.message }, 400);

  const userId = newUserData.user.id;

  // Upsert profile with role = 'corporate'
  await adminSupabase.from("profiles").upsert({
    id: userId,
    role: "corporate",
    full_name: contact_name || company_name,
  }, { onConflict: "id" });

  // Insert corporate_account
  const { data: account, error: accountError } = await adminSupabase
    .from("corporate_accounts")
    .insert({
      user_id: userId,
      company_name,
      contact_name: contact_name || null,
      email,
      commission_pct,
      notes: notes || null,
      created_by: callerUser.id,
    })
    .select()
    .single();

  if (accountError) {
    // Rollback: delete the auth user we just created
    await adminSupabase.auth.admin.deleteUser(userId);
    return jsonResponse({ error: accountError.message }, 500);
  }

  return jsonResponse({ success: true, user_id: userId, account });
});
