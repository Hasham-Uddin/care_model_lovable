import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PHASE = (n: number) =>
  n <= 5 ? "Phase 1 — Community Assessment"
  : n <= 10 ? "Phase 2 — Solution Development"
  : "Phase 3 — Implementation & Measurement";

// Canonical 12-session curriculum (mirrors src/config/sessionContent.ts).
// Each entry: title + labels for the 2-3 worksheet inputs the facilitator fills in.
const SESSION_MAP: Record<number, { title: string; inputs: Record<string, string> }> = {
  1:  { title: "Problem Statement", inputs: { input1: "Core problem (community framing, root causes, systemic context)", input2: "Who is most affected + community strengths/assets" } },
  2:  { title: "Define Community", inputs: { input1: "Community groups most impacted (who, why, cultural context)", input2: "Shared strengths, networks, lived experience across groups" } },
  3:  { title: "Historical Timeline", inputs: { input1: "Historical events, policies, and systems that shaped the problem", input2: "How the community has resisted, adapted, and built power" } },
  4:  { title: "Invested Parties", inputs: { input1: "Stakeholders / invested parties (name, role, relationship to problem)", input2: "How each will be engaged (allies, decision-makers, gatekeepers)" } },
  5:  { title: "Data Storytelling", inputs: { input1: "Baseline data and community stories that frame the problem", input2: "Gaps in the data and root-cause questions still to investigate" } },
  6:  { title: "Community Asset Mapping", inputs: { input1: "Community assets — people, places, programs, institutions", input2: "How each asset supports the solutions / theory of change" } },
  7:  { title: "Solutions Alignment", inputs: { input1: "Candidate solutions considered", input2: "Prioritization criteria (impact, feasibility, resources) and ranking" } },
  8:  { title: "Theory of Change I: Inputs & Activities", inputs: { input1: "Inputs required (people, funding, partnerships, knowledge)", input2: "Activities the program will run" } },
  9:  { title: "Theory of Change II: Outcomes & Impact", inputs: { input1: "Short- and mid-term outcomes", input2: "Long-term community impact + key assumptions" } },
  10: { title: "Community Impact Metrics", inputs: { input1: "Quantitative metrics with targets and measurement methods", input2: "Qualitative indicators of community-defined success" } },
  11: { title: "Data Collection Plan", inputs: { input1: "Each data point — method, timing, who is responsible", input2: "Privacy protections, consent, and community data ownership" } },
  12: { title: "Showcase & Sharing", inputs: { input1: "Target audiences + key message and desired action for each", input2: "Formats, community storytellers, and consent process for each deliverable" } },
};

// Which sessions feed which Community Mobilization Guide sections.
const SECTION_SOURCE_MAP = `
- Executive Summary ............ synthesizes Sessions 1, 2, 7, 9
- Mission ...................... Organization mission + Session 1
- Solutions .................... Session 7 (Solutions Alignment) + Session 8 (Activities)
- Community Impact Metrics ..... Session 10
- Problem (Opportunity) ........ Session 1
- Population Served ............ Session 2
- Historical Context ........... Session 3
- Community Impact Tree ........ Sessions 1, 2 (root population + connected groups)
- Stakeholder Analysis ......... Session 4
- Data Collection Plan ......... Sessions 5 + 11
- Community Asset Mapping ...... Session 6
- Solutions Alignment .......... Session 7
- Solutions Discussion ......... Sessions 7 + 8 (program description per solution)
- Theory of Change ............. Sessions 8 + 9 (Inputs→Activities→Outcomes→Impact + Assumptions)
- Community Impact Metrics Tool  Session 10 (long-term goal + per-metric definitions)
- Metrics Data Collection Plan . Session 11 (cadence, owner, analysis)
- Conclusion ................... Session 12 (showcase/forward-looking framing)
`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: userData, error: userErr } = await sb.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { projectId } = await req.json();
    if (!projectId || typeof projectId !== "string") {
      return new Response(JSON.stringify({ error: "projectId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Use the caller's JWT so RLS is enforced
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const [{ data: project, error: pErr }, { data: sessions }, { data: artifacts }, { data: interrogations }] = await Promise.all([
      userClient.from("projects").select("id, name, organizations(name, location, mission)").eq("id", projectId).single(),
      userClient.from("sessions").select("id, session_number, session_name, status, notes, next_steps").eq("project_id", projectId).order("session_number"),
      userClient.from("artifacts").select("session_id, artifact_type, content").eq("project_id", projectId),
      userClient.from("interrogations").select("session_id, mode, challenge_tags, model_output, verdict, model_revision, affected_groups").eq("project_id", projectId).limit(40),
    ]);

    if (pErr || !project) {
      return new Response(JSON.stringify({ error: "Project not found or not authorized" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build a compact, structured digest of all session work.
    const orgName = (project as any).organizations?.name || "the organization";
    const orgLocation = (project as any).organizations?.location || "";
    const orgMission = (project as any).organizations?.mission || "";

    const sessionDigest = (sessions || []).map((s: any) => {
      const meta = SESSION_MAP[s.session_number];
      const canonicalTitle = meta?.title || s.session_name;
      const sArtifacts = (artifacts || []).filter((a: any) => a.session_id === s.id);
      const refined = sArtifacts.map((a: any) => a.content?.refined).filter(Boolean).join("\n\n").trim();
      const drafts = sArtifacts
        .map((a: any) => {
          const c = a.content || {};
          const fields = Object.entries(c)
            .filter(([k]) => k !== "refined")
            .map(([k, v]) => {
              const label = meta?.inputs?.[k] || k;
              const val = typeof v === "string" ? v : JSON.stringify(v);
              return `  - [${label}]\n    ${val.replace(/\n/g, "\n    ")}`;
            })
            .join("\n");
          return fields;
        })
        .filter(Boolean)
        .join("\n");

      return [
        `### Session ${s.session_number} — ${canonicalTitle} (${PHASE(s.session_number)})`,
        refined ? `REFINED OUTPUT:\n${refined}` : null,
        drafts ? `WORKSHEET INPUTS:\n${drafts}` : null,
        s.notes?.trim() ? `FACILITATOR NOTES:\n${s.notes.trim()}` : null,
        s.next_steps?.trim() ? `COMMITTED NEXT STEPS:\n${s.next_steps.trim()}` : null,
      ].filter(Boolean).join("\n");
    }).join("\n\n");

    const interrogationDigest = (interrogations || []).length
      ? (interrogations || []).slice(0, 20).map((i: any, idx: number) =>
          `${idx + 1}. mode=${i.mode}; verdict=${i.verdict ?? "n/a"}; tags=${(i.challenge_tags || []).join(", ")}; affected=${(i.affected_groups || []).join(", ")}`
        ).join("\n")
      : "None recorded.";

    // The downstream PDF renderer expects these ## sections (one page each).
    const REQUIRED_SECTIONS = [
      "Executive Summary",
      "Mission",
      "Assessment",
      "Stakeholders",
      "Problem",
      "Solutions",
      "Implementation",
      "Measurement",
    ];

    const systemPrompt = `You are a senior strategy writer producing a publication-quality MEASURE CARE Model Community Mobilization Guide for a community organization that has worked through the 12-session CARE curriculum (Community, Advocacy, Resilience, Evidence).

Your job is to SYNTHESIZE the 12 sessions of worksheet inputs into a coherent narrative guide that is rendered as a fixed-length PDF — ONE PAGE PER SECTION.

SOURCE-OF-TRUTH MAPPING:
${SECTION_SOURCE_MAP}

ABSOLUTE RULES:
- Output VALID MARKDOWN only — use ## H2 headings, ### H3 subheadings, and - bulleted lists. No tables, no code fences, no images, no horizontal rules.
- Return EXACTLY 8 sections, in the EXACT order below, each prefixed with "## " followed by the exact title shown. Do NOT add, rename, reorder, merge, or drop any section.
- Each section MUST fit on one printed page. HARD LIMITS PER SECTION: at most 280 words AND at most ~1800 characters. Use short paragraphs (2–3) or bullet lists. NEVER exceed these limits.
- Do NOT include a leading # H1 title and do NOT include any prose before the first ## heading.
- If a source session has no worksheet input or refined output, write the literal sentence: "This section will be developed in upcoming sessions." and nothing else for that section.
- Do NOT mention "session N of 12", completion percentages, or status labels.
- Do NOT list raw user inputs verbatim. Translate worksheet inputs into polished strategic prose.
- Do NOT fabricate community names, statistics, partners, quotes, or geographies not present in the source material.
- Use plain professional English. No emojis. No hype words.

REQUIRED 8 SECTIONS (use these exact H2 titles, in this exact order):

## Executive Summary
2–3 short paragraphs synthesizing Sessions 1, 2, 7, 9. Name the problem, the population most affected, the organization's response, and the intended long-term impact. NEVER leave this section empty.

## Mission
Use exactly these three H3 subsections in this order. Do NOT repeat the organization's stated mission verbatim — it is shown separately from the project profile.

### Our Vision
One paragraph describing the long-term future this organization is working toward, grounded in Session 1. If Session 1 is thin, infer carefully from the stated mission without fabricating names, places, or statistics.

### Strategic Alignment
One paragraph explaining how this strategic plan and named project advance the organization's mission. Reference the core problem and intended impact from Session 1.

## Assessment
Use exactly these four H3 subsections in this order. One short paragraph each (~60–90 words), synthesizing Phase 1 (Sessions 1–5).

### Community Landscape
Geographic, social, and economic context of the community — where the need shows up and what shapes daily life.

### Population Served
Who is most affected — demographics, community characteristics, and the groups this plan centers.

### Baseline Insights
Key data and findings from Sessions 2, 3, and 5 — what the team has learned so far.

### Historical Context
How past conditions, policies, or events shape the present challenge and why timing matters now.

## Stakeholders
Use exactly these two H3 subsections in this order, synthesizing Session 4.

### Engagement Strategy
One short paragraph on how the CARE Team will engage stakeholders, build coalitions, and navigate power dynamics.

### Key Stakeholders
Up to 6 bullets. Each bullet: **Group name** — role, power/alignment (Ally, Neutral, Mixed, or Opposition), and how they will be engaged.

## Problem
Use exactly these four H3 subsections in this order, synthesizing Sessions 1 and 3.

### Problem Statement
One paragraph framing the core challenge from the community's perspective — systemic, not deficit-based.

### Root Causes
One paragraph on underlying causes and contributing factors beneath the surface problem.

### Systemic Drivers
One paragraph on policies, institutions, and structural forces that sustain the problem.

### Why Now
One paragraph on urgency, timing, and why action is needed at this moment.

## Solutions
Use exactly these two H3 subsections in this order, synthesizing Sessions 7 + 8.

### Strategic Approach
One short paragraph explaining Solutions Alignment — how the CARE Team evaluated options against desirability, equity, feasibility, and sustainability.

### Core Solutions
A markdown table with columns: Solution | Desirability | Equitably | Feasibility | Sustainability
Include 2–4 rows. In the Solution column, start each entry with a bold action verb (e.g., **ADVOCATE**, **EDUCATE**, **SUPPORT**) followed by one sentence. Use High, Medium, or Low for each rating column.

## Implementation
Use exactly these four H3 subsections in this order, synthesizing Sessions 6, 8, and 11.

### Roadmap Overview
One paragraph framing how the CARE Team will move from plan to action — community-led delivery, asset mobilization, and accountability.

### Community Assets
One paragraph on the people, places, and networks that will power implementation (from Session 6).

### Timeline & Roles
One paragraph on who does what, key activities, and sequencing (from Sessions 8 + 9).

### Data & Accountability
One paragraph on data collection, privacy protections, and how the community stays informed (from Session 11).

## Measurement
Use exactly these two H3 subsections in this order, synthesizing Session 10.

### Measurement Approach
One short paragraph on how the CARE Team chose metrics — community-defined success, feasible collection, and balance of quantitative and qualitative indicators.

### Success Indicators
A markdown table with columns: Metric | Indicator | Target | Method | Frequency
Include 2–4 rows. In the Metric column, start each entry with a bold metric name (e.g., **ATTENDANCE**, **READING LEVEL**) followed by what is measured. Use concise values for Indicator, Target, Method, and Frequency.`;

    const userPrompt = `Organization: ${orgName}${orgLocation ? ` (${orgLocation})` : ""}
Stated Mission: ${orgMission || "(not provided)"}
Project Name: ${(project as any).name}

INTERROGATION SUMMARY (most recent 20):
${interrogationDigest}

SESSION WORK (synthesize across all of this; do not list it back):

${sessionDigest || "(No session work recorded yet.)"}

Now write the full Strategic Plan as EXACTLY 8 ## sections in the required order. Remember the per-section word/character limits.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds to continue generating Strategic Plans." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    let narrative = data.choices?.[0]?.message?.content?.trim() || "";

    // Unwrap an outer ```markdown ... ``` fence if Gemini wrapped the whole output
    const fenceMatch = narrative.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n?```\s*$/i);
    if (fenceMatch) narrative = fenceMatch[1].trim();

    // Strip optional H1 document title (single #) — keep section content
    narrative = narrative.replace(/^\s*#(?!#)\s+[^\n]+\n+/, "").trim();

    // === Normalize to EXACTLY 8 sections in the required order ===
    const found = new Map<string, string>();
    const h2Regex = /^##\s+(.+)$/gm;
    const matches = [...narrative.matchAll(h2Regex)];
    if (matches.length === 0 && narrative.trim()) {
      found.set("executive summary", narrative.trim());
    } else {
      if (matches[0]?.index! > 0) {
        const preamble = narrative.slice(0, matches[0].index!).trim();
        if (preamble) found.set("executive summary", preamble);
      }
      for (let i = 0; i < matches.length; i++) {
        const title = matches[i][1].trim().replace(/^\*+|\*+$/g, "").toLowerCase();
        const start = matches[i].index! + matches[i][0].length;
        const end = i + 1 < matches.length ? matches[i + 1].index! : narrative.length;
        const body = narrative.slice(start, end).trim();
        if (!found.has(title) || body) found.set(title, body);
      }
    }

    const ALIASES: Record<string, string[]> = {
      "executive summary": ["executive summary", "summary", "executive overview", "overview"],
      "mission": ["mission", "our mission", "organization mission & vision"],
      "assessment": [
        "assessment",
        "community context & assessment",
        "community context",
        "population served",
        "community served",
        "who we serve",
      ],
      "stakeholders": ["stakeholders", "stakeholder analysis", "invested parties"],
      "problem": ["problem", "problem (opportunity)", "problem statement", "the problem", "root cause & problem framing"],
      "solutions": ["solutions", "solutions discussion", "solutions alignment", "proposed solutions"],
      "implementation": ["implementation", "implementation plan", "implementation roadmap", "data collection plan", "community asset mapping"],
      "measurement": ["measurement", "community impact metrics", "metrics", "community impact metrics tool"],
    };

    const PLACEHOLDER = "This section will be developed in upcoming sessions.";
    const rebuilt: string[] = [];
    for (const sectionTitle of REQUIRED_SECTIONS) {
      const aliasList = ALIASES[sectionTitle.toLowerCase()] || [sectionTitle.toLowerCase()];
      let body = "";
      for (const alias of aliasList) {
        if (found.has(alias) && found.get(alias)!.trim()) {
          body = found.get(alias)!.trim();
          break;
        }
      }
      if (!body) body = PLACEHOLDER;
      // Enforce a hard ~1800 character cap defensively.
      if (body.length > 1800) {
        body = body.slice(0, 1780).replace(/\s+\S*$/, "") + "…";
      }
      rebuilt.push(`## ${sectionTitle}\n\n${body}`);
    }
    narrative = rebuilt.join("\n\n");

    console.log("[generate-strategic-plan] sections:", REQUIRED_SECTIONS.length, "length:", narrative.length);
    if (!narrative) throw new Error("AI returned an empty plan");

    return new Response(JSON.stringify({ narrative }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-strategic-plan:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
