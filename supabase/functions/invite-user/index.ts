import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    console.log("Auth header present:", !!authHeader);
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;
    console.log("Env vars present - URL:", !!supabaseUrl, "ServiceRole:", !!serviceRoleKey, "AnonKey:", !!anonKey);

    // Client with user's token to get their identity
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    console.log("User lookup result:", user?.email, "error:", userError?.message);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized", detail: userError?.message }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use admin client to find the actual user by email and check their role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    
    // Look up user in auth.users by email to get the correct DB user_id
    const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();
    console.log("Listed users count:", users?.length, "error:", listError?.message);
    if (listError) {
      return new Response(JSON.stringify({ error: "Failed to verify admin status", detail: listError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dbUser = users?.find((u: any) => u.email === user.email);
    console.log("Found DB user:", dbUser?.id, dbUser?.email);
    if (!dbUser) {
      return new Response(JSON.stringify({ error: "User not found in database" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role using the correct DB user_id
    const { data: roleData, error: roleError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", dbUser.id)
      .eq("role", "admin")
      .single();

    console.log("Role check - data:", roleData, "error:", roleError?.message);

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required", userId: dbUser.id }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get email from request body
    const { email } = await req.json();
    console.log("Invite email:", email);
    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send invite
    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${req.headers.get("origin") || supabaseUrl}`,
    });

    console.log("Invite result - success:", !!data?.user, "error:", error?.message);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, user: data.user }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.log("Caught error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
