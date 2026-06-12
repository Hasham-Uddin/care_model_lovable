import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
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

    const { count = 5, domains = [] } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const domainList = domains.length > 0 
      ? domains.join(', ') 
      : 'healthcare, hiring, education, policing, housing, lending, social services';

    const systemPrompt = `You are an expert in generating high-quality synthetic training data based on the Theory of Interrogative Reasoning (TIR). Your task is to create realistic examples that demonstrate how bias can be surfaced and interrogated through the four key principles: proximity, belief, timing, and collaboration.

Each example should be grounded in real-world contexts and show authentic human reasoning, not artificial or tokenistic scenarios. Focus on situations where people closest to an issue challenge assumptions, collaborate to reframe problems, and arrive at more equitable outcomes.

Generate exactly ${count} diverse examples across these domains: ${domainList}.

For each example, provide a JSON object with these exact fields:
{
  "scenario": "Brief description of the real-world context (1-2 sentences)",
  "initial_statement": "The original statement or model output showing potential bias or problematic assumption",
  "interrogative_response": "How someone with proximity to the issue questions or challenges this (2-3 sentences)",
  "collaborative_reasoning": "How others join to re-evaluate, providing different perspectives (2-3 sentences)",
  "revised_outcome": "The more equitable, informed version of the original statement",
  "annotation": "Short reflection on which TIR principles (proximity, belief, timing, collaboration) were applied and how (2-3 sentences)",
  "domain": "The specific domain (e.g., healthcare, hiring, education)",
  "affected_groups": ["group1", "group2"],
  "harm_types": ["harm1", "harm2"]
}

Ensure diversity in:
- Geographic locations and cultures
- Identity markers (race, gender, age, disability, socioeconomic status)
- Language patterns and communication styles
- Types of bias (explicit, implicit, systemic, algorithmic)
- Settings (urban, rural, institutional, community-based)

Keep tone authentic. Avoid stereotypes and tokenism. Show real complexity and nuance.

Return ONLY a valid JSON array of ${count} examples, with no additional text or markdown formatting.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate ${count} diverse TIR training examples.` }
        ],
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    let syntheticData = data.choices[0].message.content;

    // Clean up markdown formatting if present
    syntheticData = syntheticData.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const parsedData = JSON.parse(syntheticData);
      return new Response(JSON.stringify({ data: parsedData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Failed to parse AI response:', syntheticData);
      throw new Error('AI returned invalid JSON format');
    }

  } catch (error) {
    console.error('Error in generate-synthetic-data:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
