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

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: userData, error: userErr } = await sb.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { sessionData, projectData, artifacts, interrogations } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a thoughtful facilitator crafting a wrap-up email for a CARE Model session focused on equity and AI interrogation. Your email should:

1. **Acknowledge the Work**: Celebrate what the team accomplished in this specific session
2. **Explain TIR Interrogation**: Briefly describe how the Theory of Interrogative Reasoning (proximity, belief, timing, collaboration) was used to interrogate AI outputs
3. **Give Credit**: Honor the community voices and perspectives that shaped the work
4. **Clarify Data Contribution**: Explain that their anonymized session data may be used to train more equitable AI systems, respecting their consent choices

Tone: Warm, appreciative, clear, and empowering. Avoid jargon. Make people feel their contribution matters.

Format the email with:
- Subject line
- Greeting
- Body with clear sections
- Closing

Keep it concise (400-600 words) but meaningful.`;

    const userPrompt = `Generate a wrap-up email for:

**Session**: ${sessionData.session_name} (Session ${sessionData.session_number})
**Project**: ${projectData.name}
**Organization**: ${projectData.organization?.name || "Community Organization"}

**What We Worked On**:
${sessionData.notes || "The team engaged in collaborative problem-solving using the CARE Model framework."}

**Artifacts Created**: ${artifacts.length} work product(s)
${artifacts.length > 0 ? `- Key outputs: ${artifacts.map((a: any) => a.artifact_type).join(", ")}` : ""}

**AI Interrogations Performed**: ${interrogations.length}
${interrogations.length > 0 ? `
- Challenged AI outputs using TIR principles
- Surfaced potential harms: ${[...new Set(interrogations.flatMap((i: any) => i.challenge_tags))].join(", ")}
- Centered affected groups: ${[...new Set(interrogations.flatMap((i: any) => i.affected_groups))].join(", ")}
` : ""}

**Data Contribution Consent**:
- Consent given: ${projectData.data_donation_consent ? "Yes" : "No"}
- Data anonymized: ${projectData.data_anonymized ? "Yes" : "No"}
- Consent revocable: ${projectData.consent_revocable ? "Yes" : "No"}

Generate an email that makes participants feel proud of their work and understand how their contribution (if they consented) will help build more equitable AI systems.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const emailContent = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ emailContent }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in generate-session-email function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
