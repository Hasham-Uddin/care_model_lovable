import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Worksheet questions for each session — AI must directly answer these
// Maps artifact_type values to worksheet questions
const worksheetQuestions: Record<string, { q1: string; q2: string; q3?: string }> = {
  problem_statement: {
    q1: "What is the core problem your community is facing?",
    q2: "Who is most affected and what strengths does the community bring?",
  },
  community_group: {
    q1: "List each community group most impacted by the problem",
    q2: "What strengths and assets does each group bring?",
    q3: "What is your community feedback plan?",
  },
  timeline_event: {
    q1: "List key events, policies, and decisions in chronological order",
    q2: "List community responses and resistance at each stage",
  },
  invested_party: {
    q1: "List all stakeholders involved in this issue",
    q2: "Rate each stakeholder's power and alignment",
  },
  dataset: {
    q1: "List each data source and what it reveals",
    q2: "What community stories contextualize each data point?",
  },
  asset_map: {
    q1: "List community assets by category (People, Places, Organizations, Skills, Culture)",
    q2: "How could these assets be better connected or leveraged?",
  },
  solution: {
    q1: "List solutions the community has proposed or tried before",
    q2: "List new solutions that build on community assets",
  },
  toc_node: {
    q1: "List all resources and inputs needed",
    q2: "List specific activities you will implement",
  },
  cim_metric: {
    q1: "List quantitative metrics with targets",
    q2: "List qualitative indicators of success",
  },
  data_plan: {
    q1: "List each data point with method, timing, and who's responsible",
    q2: "How will you protect privacy and ensure community data ownership?",
  },
  toc_node_outcomes: {
    q1: "List expected outcomes by timeframe (Short-term, Medium-term, Long-term)",
    q2: "List the assumptions underlying this theory of change",
  },
  solution_showcase: {
    q1: "List each audience and your key message for them",
    q2: "List the formats and who leads each",
  },
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

    const { sessionType, sessionNumber, userPrompt, context } = await req.json();
    
    // Use sessionNumber for disambiguation when artifact types are shared
    const effectiveType = sessionNumber === 9 ? "toc_node_outcomes" 
      : sessionNumber === 12 ? "solution_showcase"
      : sessionType;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const questions = worksheetQuestions[effectiveType] || worksheetQuestions["problem_statement"];
    const questionContext = questions.q3
      ? `The worksheet asks these questions:\n1. "${questions.q1}"\n2. "${questions.q2}"\n3. "${questions.q3}"`
      : `The worksheet asks these questions:\n1. "${questions.q1}"\n2. "${questions.q2}"`;

    const baseIntro = `You are a CARE Model facilitator assistant helping a community group complete their worksheet.

${questionContext}

Your task: GENERATE substantive ANSWERS to each worksheet question using the user's input and any provided context. You are NOT here to restate, rephrase, or echo the questions back. You must produce NEW content that directly answers them.

ABSOLUTE RULES — violating any of these means failure:
1. NEVER repeat, paraphrase, or restate the worksheet questions as your answer.
2. NEVER respond with phrases like "The core problem is..." followed by the question itself.
3. If the user input is sparse, vague, or just a topic name, INFER reasonable, evidence-grounded community-centered answers and clearly mark assumptions with "(Assumption: ...)".
4. If the user input is genuinely empty, respond ONLY with: "Please share a few sentences about your community's situation so I can draft answers. For example: who is affected, where, and what you've observed."
5. Each bullet must contain a CONCRETE noun + verb + specific detail. No generic filler.
6. Keep each bullet ONE sentence max. Total response under 300 words.`;

    const systemPrompts: Record<string, string> = {
      problem_statement: `${baseIntro}

**QUESTION 1: "${questions.q1}"**
Write 3-4 sentences naming the systemic root cause, impacted community, and resulting harm. Name specific policies or systems responsible.

**QUESTION 2: "${questions.q2}"**
List 3 groups most affected, one bullet each: who they are and what strengths they bring.

Use 8th grade reading level. No deficit framing.`,

      community_group: `${baseIntro}

**QUESTION 1: "${questions.q1}"**
List 3-5 community groups, one bullet each. Format: "• [Group] — [why impacted]"

**QUESTION 2: "${questions.q2}"**
For each group, one bullet on strengths. Format: "• [Group] — [key strengths]"

**QUESTION 3: "${questions.q3}"**
2-3 bullets on feedback methods and timing.

Asset-based framing. No deficit language.`,

      timeline_event: `${baseIntro}

**QUESTION 1: "${questions.q1}"**
List 4-5 events chronologically. Format: "• [Year] — [What happened and its impact]"

**QUESTION 2: "${questions.q2}"**
For each event, one bullet on community response. Format: "• [Year] — [How community responded]"`,

      invested_party: `${baseIntro}

**QUESTION 1: "${questions.q1}"**
List 4-5 stakeholders. Format: "• [Stakeholder] — [role and interest]"

**QUESTION 2: "${questions.q2}"**
For each, rate power and alignment. Format: "• [Stakeholder] — Power: [H/M/L] — Alignment: [Ally/Neutral/Opposition]"`,

      dataset: `${baseIntro}

**QUESTION 1: "${questions.q1}"**
List 3-5 data sources. Format: "• [Source] — [Key finding]"

**QUESTION 2: "${questions.q2}"**
For each, one bullet of community context. Format: "• [Data point] — [What community says about it]"`,

      asset_map: `${baseIntro}

**QUESTION 1: "${questions.q1}"**
List 4-6 assets by category (People, Places, Orgs, Culture), one bullet each.

**QUESTION 2: "${questions.q2}"**
List 2-3 connections between assets. Format: "• [Asset A] + [Asset B] = [potential outcome]"`,

      solution: `${baseIntro}

**QUESTION 1: "${questions.q1}"**
List 3-5 past solutions. Format: "• [Solution and year] — Worked: [what succeeded] — Challenge: [what didn't work and why]"

**QUESTION 2: "${questions.q2}"**
List 3-5 new solutions. Format: "• [Solution] → Builds on: [specific assets from Meeting 6] → Led by: [community members/groups]"

Link every solution to specific community assets.`,

      toc_node: `${baseIntro}

**QUESTION 1: "${questions.q1}"**
List 3-5 resources. Format: "• [Category] — [Resource]"

**QUESTION 2: "${questions.q2}"**
List 3-5 activities. Format: "• [Activity] — Who: [responsible] — When: [timing]"`,

      toc_node_outcomes: `${baseIntro}

**QUESTION 1: "${questions.q1}"**
Organize into three tiers:
"Short-term (0-6 months):" — list 3-4 specific, measurable outputs
"Medium-term (1-2 years):" — list 3-4 behavioral/systemic shifts
"Long-term (3-5 years):" — list 2-3 transformation goals

**QUESTION 2: "${questions.q2}"**
List 4-6 assumptions. Format: "• Assumption: [what must be true for this to work]" and "• Risk: [what could go wrong]"`,

      cim_metric: `${baseIntro}

**QUESTION 1: "${questions.q1}"**
List 3-4 metrics. Format: "• [Metric] — Target: [number] — Tracked via: [method]"

**QUESTION 2: "${questions.q2}"**
List 3-4 qualitative indicators. Format: "• [Indicator] — Captured via: [method]"`,

      data_plan: `${baseIntro}

**QUESTION 1: "${questions.q1}"**
List 3-5 data points. Format: "• [Data point] — Method: [how] — When: [timing] — Who: [responsible]"

**QUESTION 2: "${questions.q2}"**
List 3-5 protections. Format: "• [Protection]: [how it works]"`,

      solution_showcase: `${baseIntro}

**QUESTION 1: "${questions.q1}"**
List 3-5 audiences. Format: "• [Audience] — Message: [core message] — Desired Action: [what you want them to do]"

**QUESTION 2: "${questions.q2}"**
List 3-5 deliverables. Format: "• [Format/deliverable] — Led by: [community member/group] — Consent: [how consent is handled]"

Community members should lead storytelling.`,

      default: `You are a CARE Model facilitator assistant. Be CONCISE — under 300 words total.

Based on the user's input, provide clear, structured guidance using an anti-racist, community-centered lens.

Rules:
- Use bullet points with ONE sentence each
- 3-5 bullet points max
- Directly answer the questions
- No deficit framing, no stereotypes`
    };

    const systemPrompt = systemPrompts[effectiveType] || systemPrompts.default;

    const trimmedUserPrompt = (userPrompt ?? "").trim();
    const contextStr = context ? JSON.stringify(context).slice(0, 4000) : "";
    const userMessage = trimmedUserPrompt.length === 0
      ? `(The user did not provide input. Use the worksheet context below if it contains usable information; otherwise return the fallback message defined in the system prompt.)\n\nWorksheet context: ${contextStr || "(empty)"}`
      : (contextStr
          ? `Worksheet context so far: ${contextStr}\n\nUser input to expand into answers: ${trimmedUserPrompt}`
          : `User input to expand into answers: ${trimmedUserPrompt}`);

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "system", content: "FORMAT RULES:\n1. Start each section with a bold header that LABELS the answer (e.g. **Core Problem**, **Most Affected Groups**) — do NOT use the worksheet question itself as the header.\n2. Under each header, write bullet points that GENERATE answers — never restate the question.\n3. Each bullet: ONE complete sentence with concrete specifics (who/what/where/when).\n4. No preamble, no apologies, no meta-commentary about the question.\n5. STRICT: Total response under 300 words.\n6. If you find yourself about to write the question back as the answer, STOP and write a real answer instead." },
      { role: "user", content: userMessage }
    ];

    console.log("AI request initiated", { sessionType, promptLength: userPrompt?.length });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded.", rateLimited: true }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted.", paymentRequired: true }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("No response from AI");
    }

    return new Response(
      JSON.stringify({ response: aiResponse, model: "google/gemini-2.5-flash", sessionType }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-assistant:", error instanceof Error ? error.message : "Unknown error");
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
