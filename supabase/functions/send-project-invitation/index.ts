import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { projectId, email, fullName, role } = await req.json();

    // Validate inputs
    if (!projectId || !email || !fullName || !role) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["care_team_leader", "care_team_member"].includes(role)) {
      return new Response(JSON.stringify({ error: "Invalid role" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the inviter has permission
    const { data: project } = await adminClient
      .from("projects")
      .select("id, name, facilitator_id")
      .eq("id", projectId)
      .single();

    if (!project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check permission: facilitator can invite leaders & members, leaders can invite members only
    const isFacilitator = project.facilitator_id === user.id;
    
    const { data: isAdmin } = await adminClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    const { data: isLeader } = await adminClient.rpc("is_care_team_leader", {
      _user_id: user.id,
      _project_id: projectId,
    });

    if (!isFacilitator && !isAdmin && !isLeader) {
      return new Response(JSON.stringify({ error: "Not authorized to invite" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Leaders can only invite members, not other leaders
    if (isLeader && !isFacilitator && !isAdmin && role === "care_team_leader") {
      return new Response(JSON.stringify({ error: "Team leaders can only invite team members" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create invitation
    const { data: invitation, error: invError } = await adminClient
      .from("project_invitations")
      .insert({
        project_id: projectId,
        email: email.trim().toLowerCase(),
        full_name: fullName.trim(),
        role,
        invited_by: user.id,
      })
      .select()
      .single();

    if (invError) {
      console.error("Invitation error:", invError);
      return new Response(JSON.stringify({ error: "Failed to create invitation" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build the invitation link
    const appUrl = req.headers.get("origin") || "https://careful-ai-guide.lovable.app";
    const inviteLink = `${appUrl}/accept-invitation?token=${invitation.token}`;

    const roleLabel = role === "care_team_leader" ? "CARE Team Leader" : "CARE Team Member";

    // Try to send email via Resend if configured
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    if (resendKey && lovableKey) {
      try {
        const emailRes = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${lovableKey}`,
            "X-Connection-Api-Key": resendKey,
          },
          body: JSON.stringify({
            from: "Measure CARE Model <onboarding@resend.dev>",
            to: [email],
            subject: `You're invited to join "${project.name}" as a ${roleLabel}`,
            html: `
              <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
                <h1 style="color: #253B96; font-size: 24px;">You've Been Invited!</h1>
                <p>Hello <strong>${fullName}</strong>,</p>
                <p>You've been invited to join the project <strong>"${project.name}"</strong> as a <strong>${roleLabel}</strong> on the Measure CARE Model AI Interrogation Tool.</p>
                <p style="margin: 24px 0;">
                  <a href="${inviteLink}" style="background-color: #253B96; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Accept Invitation
                  </a>
                </p>
                <p style="color: #666; font-size: 14px;">This invitation expires in 7 days.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
                <p style="color: #999; font-size: 12px;">Measure CARE Model — The people closest to the problem are closest to the solution.</p>
              </div>
            `,
          }),
        });
        if (!emailRes.ok) {
          console.error("Email send failed:", await emailRes.text());
        }
      } catch (emailErr) {
        console.error("Email error:", emailErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        invitation: {
          id: invitation.id,
          token: invitation.token,
          inviteLink,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
