# PDF Page Implementation Guide

**Purpose:** Map each of your **11 HTML page designs** (`care_model_pdf/`) to the CARE Model app — what is static, what comes from the database, what needs AI, and how to implement it on Lovable.

**Related docs:** [STRATEGIC_PLAN_PDF_EXPORT.md](./STRATEGIC_PLAN_PDF_EXPORT.md)

---

## Table of Contents

1. [Current State Summary](#current-state-summary)
2. [Architecture Decision](#architecture-decision)
3. [Page-by-Page Analysis (Your 11 HTML Designs)](#page-by-page-analysis-your-11-html-designs)
4. [Additional Pages Beyond Your 11 Designs](#additional-pages-beyond-your-11-designs)
5. [Database Field Reference](#database-field-reference)
6. [AI Pipeline — What to Change](#ai-pipeline--what-to-change)
7. [Session → Page Data Matrix](#session--page-data-matrix)
8. [Lovable Implementation Strategy](#lovable-implementation-strategy)
9. [Lovable Prompts (Copy-Paste Ready)](#lovable-prompts-copy-paste-ready)
10. [Implementation Phases & ETA](#implementation-phases--eta)

---

## Current State Summary

You have **two separate systems** that are not connected:

| System | Location | Status |
|--------|----------|--------|
| **Your 11 HTML page designs** | `care_model_pdf/1` … `care_model_pdf/11` | Visual mockups only — **not imported by the app** |
| **Live PDF export** | `src/utils/exportProjectPdf.ts` | jsPDF builder — pages 1–3 are baked JPEG/PNG images; pages 4–16 are plain text |

### Your 11 HTML pages vs. client 15-page spec

| Your HTML # | Section | In client 15-page spec? | In live app today? |
|-------------|---------|-------------------------|-------------------|
| 1 | Cover | Yes (page 1) | Partial — static PNG, org name not overlaid |
| 2 | Letter of Acknowledgment | Yes (page 2) | Yes — static JPEG |
| 3 | About Measure & CARE Model | Yes (page 3) | Yes — static JPEG |
| 4 | Executive Summary | Yes (page 5) | Partial — AI text only, no signature block |
| 5 | Summary + Metrics | Split across Mission / Solutions / Measurement | No — layout not implemented |
| 6 | Problem (Opportunity) | Yes (page 9) | Partial — AI text only, no photo/illustration |
| 7 | Population Served + Historical Timeline | Yes (page 7) | Partial — AI text only, no map/timeline |
| 8 | Community Impact Tree | Not a separate client page (folded into Assessment) | **Missing entirely** |
| 9 | Stakeholder Analysis | Yes (page 8) | Partial — AI bullets, no table |
| 10 | Data Collection Plan | Folded into Implementation (page 11) | **Missing** — no table page |
| 11 | Community Asset Mapping | Folded into Implementation | **Missing** — no gauge/table |

**Pages in client spec but NOT in your 11 HTML designs:**

- Page 4 — Table of Contents (generated)
- Page 12 — Action Items (`sessions.next_steps` from DB)
- Page 14 — Team & Acknowledgments (`project_members` from DB)
- Page 15 — Closing / Call to Action (static template)

---

## Architecture Decision

### Recommended approach for Lovable

Use a **hybrid HTML → image → jsPDF** pipeline:

```
React page components (ported from care_model_pdf HTML/CSS)
        ↓
Inject dynamic data (DB fields + AI text + structured JSON)
        ↓
html2canvas (already in package.json) renders each page off-screen
        ↓
jsPDF.addImage() — one full-page image per PDF page
        ↓
15-page Strategic Plan PDF download
```

**Why this approach:**

- Your 11 pages already have polished CSS (tables, maps, gauges, two-column layouts).
- Rebuilding every layout in raw jsPDF `doc.text()` calls would take weeks and still look worse.
- `html2canvas` is already a project dependency.
- Pages 2–3 can stay as pre-baked static JPEGs (no dynamic data).
- Table pages (9, 10, 11) need **structured JSON from AI or DB**, not free-form markdown.

### Source type legend (used in page tables below)

| Tag | Meaning |
|-----|---------|
| **STATIC** | Same content for every project — bake as image or hardcode in HTML |
| **DB** | Direct from Supabase — no AI rewrite |
| **AI-NARRATIVE** | Gemini synthesizes prose from session artifacts |
| **AI-STRUCTURED** | Gemini returns JSON rows for tables/diagrams |
| **HYBRID** | Static HTML shell + DB and/or AI slots |
| **GENERATED** | Built entirely in code (TOC, page numbers) |

---

## Page-by-Page Analysis (Your 11 HTML Designs)

---

### Page 1 — Cover

**File:** `care_model_pdf/1/code/index.html`

**Visual layout:**
- Navy top bar with org logo
- Hero background photo
- White title card: project name + "COMMUNITY MOBILIZATION GUIDE"
- "PREPARED BY MEASURE / wemeasure.org"
- Footer: date + "CARE MODEL"

| Element | Source type | Database / AI field |
|---------|-------------|---------------------|
| Org logo | **DB** (optional) | `CoverDetails.orgLogoDataUrl` — user upload in preview dialog |
| Hero cover photo | **DB** (optional) | `CoverDetails.coverPhotoDataUrl` — user upload |
| Project title (e.g. "PATIENTS NOT PRISONERS") | **DB** | `projects.name` |
| "COMMUNITY MOBILIZATION GUIDE" subtitle | **STATIC** | Fixed label |
| "PREPARED BY MEASURE" | **STATIC** | Fixed branding |
| Footer date | **DB** | `CoverDetails.date` or `new Date()` |
| "CARE MODEL" label | **STATIC** | Fixed branding |

**Implementation notes:**
- Current app uses `COVER_MOBILIZATION_GUIDE_BASE64` (static PNG) and **ignores** cover customization fields — this is a known bug.
- Port HTML to a React component `PdfCoverPage.tsx`.
- Replace hardcoded "PATIENTS NOT PRISONERS" with `{project.name}`.
- Replace `assets/logo.svg` with dynamic `orgLogo` or a default Measure logo.

**Lovable complexity:** Medium — 4 dynamic fields, rest static.

---

### Page 2 — Letter of Acknowledgment

**File:** `care_model_pdf/2/index.html`

**Visual layout:**
- Navy header band: "Letter of Acknowledgment" + PAGE | 2
- "Dear Friend," + 6 paragraphs about Community Mobilization and CARE Model
- Meme Styles signature + portrait photo
- Blue 3D cube graphic (decorative)

| Element | Source type | Database / AI field |
|---------|-------------|---------------------|
| All body paragraphs | **STATIC** | Same for every organization — MEASURE boilerplate |
| Signature name & title | **STATIC** | "Meme Styles, Measure Founder + President" |
| Portrait photo | **STATIC** | `letterAssets.ts` → `FOUNDER_PHOTO_BASE64` |
| Blue cube graphic | **STATIC** | `letterAssets.ts` → `BLUE_CUBE_BASE64` |
| Page number | **GENERATED** | Always page 2 |

**Implementation notes:**
- **100% static** — no DB or AI needed.
- Already baked into `PDF_STATIC_PAGE_2` JPEG in the live app.
- Option A (fast): keep the JPEG as-is.
- Option B (maintainable): port HTML to React component, render once to base64 asset on deploy.

**Lovable complexity:** Low — ship as static image.

---

### Page 3 — About Measure & The CARE Model

**File:** `care_model_pdf/3/code/index.html`

**Visual layout:**
- Top: "About Measure" + 2 paragraphs
- Bottom navy block: "The CARE Model" + C/A/R/E principles list

| Element | Source type | Database / AI field |
|---------|-------------|---------------------|
| About Measure paragraphs | **STATIC** | MEASURE org description — same for all projects |
| CARE Model description | **STATIC** | Curriculum boilerplate |
| C/A/R/E principles list | **STATIC** | Fixed 4 bullet points |
| Page number | **GENERATED** | Always page 3 |

**Implementation notes:**
- **100% static** — already in `PDF_STATIC_PAGE_3` JPEG.
- Same options as Page 2: keep JPEG or port to React for easier future edits.

**Lovable complexity:** Low — ship as static image.

---

### Page 4 — Executive Summary

**File:** `care_model_pdf/4/code/index.html`

**Visual layout:**
- Header: "Executive Summary" + PAGE | 4
- 4 body paragraphs (project-specific narrative)
- Signature block: leader name, title, photo
- Footer date

| Element | Source type | Database / AI field |
|---------|-------------|---------------------|
| Body paragraphs (4) | **AI-NARRATIVE** | `## Executive Summary` from `generate-strategic-plan` |
| | | Synthesized from Sessions 1, 2, 7, 9 artifacts |
| Leader signature name | **DB** | `organizations` contact or CARE team leader from `project_members` + `profiles.full_name` |
| Leader title | **DB** | Org role — may need new field or use `care_team_leader` role label |
| Leader photo | **DB** (optional) | Not in schema today — use placeholder or org logo |
| Footer date | **DB** | Export date |

**Database tables involved:**
- `artifacts` (sessions 1, 2, 7, 9) → fed to AI
- `sessions.notes` → AI context
- `organizations.name`, `organizations.location` → AI context
- `project_members` + `profiles` → signature block

**AI edge function section:** `## Executive Summary` — 2–3 paragraphs, ≤280 words.

**Implementation notes:**
- Current app renders this as plain jsPDF text on page 5 (after TOC) with **no signature block**.
- Port HTML shell; inject AI paragraphs into `.body-text` slots.
- Trim AI text to fit one page (font-size scaling already exists in `spRenderFittedBody()`).

**Lovable complexity:** Medium — AI narrative + optional DB signature fields.

---

### Page 5 — Summary + Metrics

**File:** `care_model_pdf/5/code/index.html`

**Visual layout:**
- Two-column layout
- **Left:** MISSION box + community quote with attribution
- **Right:** SOLUTIONS list + CIM ID icons + 3 Community Impact Metrics

| Element | Source type | Database / AI field |
|---------|-------------|---------------------|
| MISSION paragraph | **HYBRID** | `organizations.mission` (DB) polished by AI into `## Mission` |
| Community quote | **AI-NARRATIVE** | Extract from Session 1/2 worksheet — needs new AI sub-prompt |
| Quote attribution name/title | **DB** | Team leader or facilitator `profiles.full_name` |
| SOLUTIONS intro + bullet list | **AI-NARRATIVE** | `## Solutions` — Sessions 7, 8 |
| CIM ID icons (fist, scales, heart-brain) | **STATIC** | SVG assets in `care_model_pdf/5/code/assets/` |
| Metric 1 title + description | **AI-STRUCTURED** | Session 10 `artifacts.content` — metric 1 |
| Metric 2 title + description | **AI-STRUCTURED** | Session 10 — metric 2 |
| Metric 3 title + description | **AI-STRUCTURED** | Session 10 — metric 3 |

**Database tables involved:**
- `organizations.mission`
- `artifacts` session 7, 8, 10 (`artifact_type`: `solution`, `cim_metric`)
- `profiles` for quote attribution

**AI sections needed (extend edge function):**
```json
{
  "mission": "1 paragraph",
  "community_quote": { "text": "...", "attribution": "..." },
  "solutions": ["ADVOCATE ...", "EDUCATE ...", "SUPPORT ..."],
  "metrics": [
    { "title": "Community Impact Metric One", "description": "..." },
    { "title": "Community Impact Metric Two", "description": "..." },
    { "title": "Community Impact Metric Three", "description": "..." }
  ]
}
```

**Implementation notes:**
- This page is **not in the current export at all** — the live app splits Mission, Solutions, and Measurement across separate pages (6, 10, 14).
- Client spec also splits these — confirm with client whether to keep this combined layout or split.
- CIM icons are static SVGs — copy to `src/assets/pdf/`.
- Metrics should come from **structured Session 10 data**, not free-form prose.

**Lovable complexity:** High — needs AI JSON output + two-column React layout.

---

### Page 6 — Problem (Opportunity)

**File:** `care_model_pdf/6/code/index.html`

**Visual layout:**
- Header + PAGE | 6
- Community group photo (full width)
- "Problem Statement:" label + narrative paragraph
- Minds illustration SVG (decorative bottom)
- Footer date

| Element | Source type | Database / AI field |
|---------|-------------|---------------------|
| Group photo | **DB** (optional) | Project cover photo or session photo upload — **not in schema today**; use stock/placeholder |
| Problem Statement text | **AI-NARRATIVE** | `## Problem` — Session 1 `artifacts.content.input1` + `refined` |
| Minds illustration | **STATIC** | `care_model_pdf/6/code/assets/minds-illustration.svg` |
| Footer date | **DB** | Export date |

**Database tables involved:**
- `artifacts` where `session_number = 1`, `artifact_type = 'problem_statement'`
- Keys: `content.input1` (core problem), `content.input2` (affected groups), `content.refined`

**AI edge function section:** `## Problem` — 2 paragraphs, may include Session 3 historical framing.

**Implementation notes:**
- Current app has AI text on page 7 with no photo or illustration.
- Photo slot: use `CoverDetails.coverPhotoDataUrl` as fallback until a dedicated field exists.

**Lovable complexity:** Medium — AI text + static illustration + optional photo.

---

### Page 7 — Population Served + Historical Timeline

**File:** `care_model_pdf/7/code/index.html`

**Visual layout:**
- "Population Served" section: map image + 2 paragraphs
- "Historical Timeline" section: explanatory text + timeline thumbnail

| Element | Source type | Database / AI field |
|---------|-------------|---------------------|
| Map image | **HYBRID** | Generic map SVG (`florida-map.svg`) + highlight from `organizations.location` (DB) |
| Population paragraphs | **AI-NARRATIVE** | `## Population Served` — Session 2 |
| Timeline intro text | **AI-NARRATIVE** | Portion of Session 3 synthesis |
| Timeline thumbnail | **AI-STRUCTURED** or **STATIC** | Session 3 events as structured list → render mini-timeline; or static placeholder |

**Database tables involved:**
- `organizations.location` — drives map label/highlights
- `artifacts` session 2 (`community_group`): `input1` (groups impacted), `input2` (strengths)
- `artifacts` session 3 (`timeline_event`): `input1` (historical events), `input2` (resistance/adaptation)

**AI edge function sections:**
- `## Population Served` — 1–2 paragraphs from Session 2
- Timeline content — extend AI to return `{ events: [{ year, label }] }` from Session 3

**Implementation notes:**
- Client spec calls this page "Community Context & Assessment" (`## Assessment`) — align heading with client.
- Map: start with a generic US/regional SVG; overlay org location text. Full geo-mapping is out of scope for v1.
- Timeline thumbnail can be a simplified generated graphic from AI event list.

**Lovable complexity:** High — map + timeline need structured AI output.

---

### Page 8 — Community Impact Tree

**File:** `care_model_pdf/8/code/index.html`

**Visual layout:**
- Intro paragraph
- Large stakeholder tree diagram (SVG)

| Element | Source type | Database / AI field |
|---------|-------------|---------------------|
| Intro paragraph | **AI-NARRATIVE** | Synthesized from Sessions 1 + 2 (root population + connected groups) |
| Tree diagram nodes | **AI-STRUCTURED** | `{ center: "...", branches: [{ label, sublabel }] }` from Sessions 1, 2, 4 |
| Tree SVG template | **STATIC** | `community-impact-tree.svg` — inject labels via React SVG overlays |

**Database tables involved:**
- Session 1: affected population (root node)
- Session 2: community groups (branch nodes)
- Session 4: stakeholders (additional branches)

**AI output needed:**
```json
{
  "intro": "1 short paragraph",
  "tree": {
    "center": "Mentally ill incarcerated people",
    "branches": [
      { "label": "Families", "sublabel": "Support systems" },
      { "label": "First Responders", "sublabel": "Law enforcement" }
    ]
  }
}
```

**Implementation notes:**
- **Completely missing** from current `exportProjectPdf.ts`.
- Use static SVG as canvas; position dynamic text labels at node coordinates.
- Cap branches at 6–8 to fit one page.

**Lovable complexity:** High — custom SVG label positioning.

---

### Page 9 — Stakeholder Analysis

**File:** `care_model_pdf/9/code/index.html`

**Visual layout:**
- "Stakeholder Analysis" + "ENGAGEMENT AND STRATEGY" subheading
- 3 intro paragraphs (boilerplate + dynamic note)
- 3-row styled table: Community Stakeholders | Role | Engagement target

| Element | Source type | Database / AI field |
|---------|-------------|---------------------|
| Intro paragraphs 1–2 | **STATIC** | MEASURE boilerplate definition of "stakeholder" |
| Intro paragraph 3 ("NOTE: Listed below...") | **STATIC** | Fixed instructional text |
| Table rows (name, role, engagement) | **AI-STRUCTURED** | Session 4 `artifacts.content` — parsed into rows |
| | | `input1`: stakeholders list |
| | | `input2`: engagement approach |

**Database tables involved:**
- `artifacts` session 4 (`invested_party`)
- `content.input1`: "Stakeholders / invested parties (name, role, relationship)"
- `content.input2`: "How each will be engaged"

**AI output needed:**
```json
{
  "stakeholders": [
    {
      "group": "Putnam & St. Johns County Behavioral Health Councils",
      "role": "7th Circuit Judge Commissioners, BH Specialist",
      "engagement": "Putnam and St. Johns County Judges and Commissioners"
    }
  ]
}
```

**Implementation notes:**
- Current app renders `## Stakeholders` as markdown bullets — no table.
- Prefer parsing Session 4 worksheet **directly** where facilitators entered structured data; use AI only to clean/format rows.
- Max 3–4 rows per page to match design.

**Lovable complexity:** Medium — table template + structured data.

---

### Page 10 — Data Collection Plan

**File:** `care_model_pdf/10/code/index.html`

**Visual layout:**
- "Data Collection Plan" + "WHAT IS A DATA COLLECTION PLAN?" subheading
- 3 intro paragraphs (mostly static)
- 4-row table: Data Needed | How To Collect | Who Will Collect

| Element | Source type | Database / AI field |
|---------|-------------|---------------------|
| Intro paragraphs | **STATIC** | MEASURE boilerplate explaining data collection plans |
| Table rows | **DB** (primary) + **AI-STRUCTURED** (fallback) | Sessions 5 + 11 artifacts |
| | | Session 5 `input1`: baseline data |
| | | Session 11 `input1`: data points, method, timing, owner |
| | | Session 11 `input2`: privacy protections |

**Database tables involved:**
- `artifacts` session 5 (`dataset`)
- `artifacts` session 11 (`data_plan`)

**AI output needed (if worksheet is unstructured prose):**
```json
{
  "rows": [
    {
      "dataNeeded": "# of incarcerated people treated for mental illness...",
      "howToCollect": "Mental Health Screening: Survey",
      "whoWillCollect": "County Sheriff's Office"
    }
  ]
}
```

**Implementation notes:**
- **Missing** from current export — folded loosely into `## Implementation` AI section.
- Session 11 worksheet is the primary source; Session 5 provides baseline context.
- Max 4 rows to fit one page.

**Lovable complexity:** Medium — table template + DB/AI rows.

---

### Page 11 — Community Asset Mapping

**File:** `care_model_pdf/11/code/index.html`

**Visual layout:**
- "Community Asset Mapping" + "CREATING SOLUTIONS" subheading
- Intro paragraph
- Resilience gauge (score 0–5) + legend
- 3-row table: Component | Baseline Score | Priority | Solutions

| Element | Source type | Database / AI field |
|---------|-------------|---------------------|
| Intro paragraph | **STATIC** + **AI-NARRATIVE** | Mostly boilerplate; one sentence from Session 6 context |
| Gauge score (e.g. "3") | **DB** or **AI-STRUCTURED** | Average of Session 6 baseline scores |
| Gauge SVG | **STATIC** | `care_model_pdf/11/code/assets/gauge.svg` — rotate needle based on score |
| Table rows | **DB** (primary) | Session 6 `artifacts.content` |
| | | `input1`: community assets (people, places, programs) |
| | | `input2`: how assets support solutions |

**Database tables involved:**
- `artifacts` session 6 (`asset_map`)

**AI output needed:**
```json
{
  "averageScore": 3,
  "rows": [
    {
      "component": "Policies and Political Structures",
      "score": 1.9,
      "priority": "High/Med",
      "solution": "ADVOCATE for better resources..."
    }
  ]
}
```

**Implementation notes:**
- **Missing** from current export.
- Gauge needle: CSS `transform: rotate()` based on `score / 5 * 180deg`.
- If Session 6 data is free text, AI must extract scores and priorities.

**Lovable complexity:** High — gauge animation + 4-column table.

---

## Additional Pages Beyond Your 11 Designs

These are required by the client spec but **not** in your `care_model_pdf/` folder. They must be built separately.

| PDF Page | Section | Source type | Implementation |
|----------|---------|-------------|----------------|
| 4 | Table of Contents | **GENERATED** | List section titles + page numbers in code — already started in `renderStrategicPlanFixed16()` |
| 12 | Action Items & Next Steps | **DB** | `sessions.next_steps` grouped by session — already in code page 12 |
| 13 | Implementation Roadmap | **AI-NARRATIVE** | `## Implementation` — Sessions 6, 11 |
| 14 | Measurement & Success Indicators | **AI-NARRATIVE** | `## Measurement` — Session 10 |
| 15 | Team & Acknowledgments | **DB** | `project_members` + `profiles` — already in code page 15 |
| 16 | Closing / Call to Action | **HYBRID** | Static template + `organizations.name`, `organizations.location` |

**Also missing from your 11 pages but in current code / client spec:**

| Section | Source | Notes |
|---------|--------|-------|
| Theory of Change | **AI-NARRATIVE** `## Theory of Change` | Sessions 8 + 9 — needs its own page template |
| Mission (standalone) | **AI-NARRATIVE** `## Mission` | Currently part of your Page 5 combined layout |

### Recommended final page order (15 pages per client spec)

| Page | Section | Your HTML design | Primary source |
|------|---------|------------------|----------------|
| 1 | Cover | Page 1 | DB + STATIC |
| 2 | Letter | Page 2 | STATIC |
| 3 | About Measure | Page 3 | STATIC |
| 4 | Table of Contents | **Build new** | GENERATED |
| 5 | Executive Summary | Page 4 | AI |
| 6 | Mission & Vision | Page 5 (left column) | DB + AI |
| 7 | Community Context & Assessment | Page 7 | AI |
| 8 | Stakeholder Analysis | Page 9 | AI-STRUCTURED + STATIC |
| 9 | Problem Framing | Page 6 | AI + STATIC assets |
| 10 | Proposed Solutions | Page 5 (right column) + Page 11 intro | AI |
| 11 | Implementation Roadmap | Page 10 + Page 11 tables | DB + AI |
| 12 | Action Items | **Build new** | DB |
| 13 | Measurement | Page 5 (metrics) | AI-STRUCTURED |
| 14 | Team | **Build new** | DB |
| 15 | Closing | **Build new** | STATIC + DB |

---

## Database Field Reference

### Tables and PDF relevance

```
organizations ──► projects ──► sessions ──► artifacts
                     │              │
                     │              └──► interrogations (AI context only)
                     │
                     └──► project_members ──► profiles
```

### Direct DB → PDF (no AI)

| Field | Table | Used on page |
|-------|-------|--------------|
| `projects.name` | projects | Cover, filename, AI context |
| `organizations.name` | organizations | Cover, Closing, AI context |
| `organizations.location` | organizations | Page 7 map label, Closing |
| `organizations.mission` | organizations | Page 5 Mission box, AI Mission section |
| `sessions.next_steps` | sessions | Page 12 Action Items |
| `sessions.session_number` | sessions | Action Items labels |
| `sessions.session_name` | sessions | Action Items labels |
| `project_members.role` | project_members | Page 14 Team grouping |
| `profiles.full_name` | profiles | Page 14 Team, Page 4 signature |
| `profiles.email` | profiles | Page 14 Team |

### Worksheet data (DB → AI → PDF)

| Session | artifact_type | content keys | Feeds pages |
|---------|---------------|--------------|-------------|
| 1 | problem_statement | input1, input2, refined | 4, 6, 8 |
| 2 | community_group | input1, input2, input3, refined | 4, 5, 7, 8 |
| 3 | timeline_event | input1, input2, refined | 6, 7 |
| 4 | invested_party | input1, input2, refined | 8, 9 |
| 5 | dataset | input1, input2, refined | 10 |
| 6 | asset_map | input1, input2, refined | 11 |
| 7 | solution | input1, input2, refined | 4, 5, 10 |
| 8 | toc_node | input1, input2, refined | 5, Theory of Change |
| 9 | toc_node | input1, input2, refined | 4, Theory of Change |
| 10 | cim_metric | input1, input2, refined | 5, 13 |
| 11 | data_plan | input1, input2, refined | 10, 11 |
| 12 | solution | input1, input2, refined | Closing context |

### Not used in polished PDF today

| Field | Notes |
|-------|-------|
| `interrogations.*` | Fetched but never rendered — optional future "Equity Review" appendix |
| `artifacts.content.ai_response` | Never sent to AI or PDF |
| `projects.facilitator_id` | Not on team roster page |
| `sessions.notes` | AI context only |

---

## AI Pipeline — What to Change

### Current state

`supabase/functions/generate-strategic-plan/index.ts` returns **one markdown string** with 9 `##` sections. This works for narrative pages but **cannot fill tables, gauges, or tree diagrams**.

### Required change: dual output

Extend the edge function to return:

```typescript
{
  narrative: string,          // existing 9 ## sections for prose pages
  structured: {
    stakeholders: StakeholderRow[],      // Page 9 table
    dataCollection: DataCollectionRow[], // Page 10 table
    assetMapping: AssetMappingRow[],     // Page 11 table
    metrics: MetricRow[],                // Page 5/13 metrics
    impactTree: ImpactTreeData,          // Page 8 diagram
    timeline: TimelineEvent[],         // Page 7 thumbnail
    communityQuote: { text, attribution } // Page 5 quote box
  }
}
```

### Updated AI prompt strategy

1. **Keep** the 9 narrative `##` sections for prose pages.
2. **Add** a JSON block at the end of the AI response (or a second API call) for structured data.
3. **Instruct Gemini:** "Do not fabricate rows. If Session N has no data, return an empty array and the PDF will show a placeholder row."
4. **Per-section word limits:** 250–350 words for narrative; max 4 table rows per table.

---

## Session → Page Data Matrix

| Session | Title | Pages fed |
|---------|-------|-----------|
| 1 | Problem Statement | 4 (Executive Summary), 6 (Problem), 8 (Impact Tree) |
| 2 | Define Community | 4, 5 (quote), 7 (Population), 8 (Impact Tree) |
| 3 | Historical Timeline | 6 (Problem history), 7 (Timeline) |
| 4 | Invested Parties | 8 (Impact Tree), 9 (Stakeholder table) |
| 5 | Data Storytelling | 10 (Data Collection) |
| 6 | Community Asset Mapping | 11 (Asset table + gauge) |
| 7 | Solutions Alignment | 4, 5 (Solutions), 10 |
| 8 | Theory of Change I | 5, Theory of Change page |
| 9 | Theory of Change II | 4, Theory of Change page |
| 10 | Community Impact Metrics | 5 (metrics), 13 (Measurement) |
| 11 | Data Collection Plan | 10, 11 (Implementation) |
| 12 | Showcase & Sharing | 15 (Closing) |

---

## Lovable Implementation Strategy

### Phase 1 — Wire static pages (1–2 days)

1. Keep Pages 2–3 as static JPEGs (`pdfStaticPage2.ts`, `pdfStaticPage3.ts`).
2. Port Page 1 HTML to `src/components/pdf/pages/PdfCoverPage.tsx`.
3. Inject `project.name`, date, optional logo/photo from `CoverDetails`.
4. Render with html2canvas → add to jsPDF as page 1.

### Phase 2 — AI narrative pages (2–3 days)

1. Port Pages 4, 6, 7 (text portions) to React components.
2. Pass AI `##` section text as props.
3. Add `spRenderFittedBody` equivalent: shrink font until text fits one page.
4. Replace `renderStrategicPlanFixed16` text rendering with html2canvas page components.

### Phase 3 — Structured table pages (3–4 days)

1. Extend `generate-strategic-plan` to return `structured` JSON.
2. Port Pages 9, 10, 11 to React table components.
3. Map DB/AI rows to table cells.
4. Show placeholder row if array is empty.

### Phase 4 — Diagram pages + remaining (2–3 days)

1. Port Page 8 (Impact Tree) — static SVG + dynamic labels.
2. Port Page 5 (Summary + Metrics) — two-column layout.
3. Build new pages: TOC, Action Items, Team, Closing, Theory of Change.
4. Enforce exactly 15 pages with page-break logic.

### Phase 5 — Preview + polish (1–2 days)

1. Update `PdfPreviewDialog` to show paginated preview (not raw markdown).
2. Test with a project that has ≥1 completed session.
3. Verify file size < 5 MB.

### File structure to create in Lovable

```
src/
  components/
    pdf/
      PdfPageRenderer.tsx       # html2canvas → canvas → jsPDF
      pages/
        PdfCoverPage.tsx        # HTML Page 1
        PdfExecutiveSummary.tsx # HTML Page 4
        PdfSummaryMetrics.tsx   # HTML Page 5
        PdfProblemPage.tsx      # HTML Page 6
        PdfPopulationPage.tsx   # HTML Page 7
        PdfImpactTreePage.tsx   # HTML Page 8
        PdfStakeholderPage.tsx  # HTML Page 9
        PdfDataCollectionPage.tsx # HTML Page 10
        PdfAssetMappingPage.tsx # HTML Page 11
        PdfTocPage.tsx          # New
        PdfActionItemsPage.tsx  # New
        PdfTeamPage.tsx         # New
        PdfClosingPage.tsx      # New
  assets/
    pdf/
      icon-fist.svg
      icon-scales.svg
      icon-heart-brain.svg
      minds-illustration.svg
      community-impact-tree.svg
      gauge.svg
      florida-map.svg
```

---

## Lovable Prompts (Copy-Paste Ready)

Use these prompts in Lovable chat to implement each piece.

---

### Prompt 1 — Master architecture

```
Refactor the Strategic Plan PDF export to use HTML React page components rendered
via html2canvas instead of raw jsPDF text for polished mode.

Create src/components/pdf/PdfPageRenderer.tsx that:
1. Accepts a React component + props
2. Renders it off-screen at 816×1056px (Letter at 96dpi)
3. Calls html2canvas and returns a PNG data URL
4. Adds the image full-bleed to jsPDF (0, 0, pageWidth, pageHeight)

Update exportProjectPdf.ts polished branch to assemble exactly 15 pages in order.
Keep pages 2-3 as existing static JPEGs (PDF_STATIC_PAGE_2, PDF_STATIC_PAGE_3).
Pages 1, 4-15 should use React components from src/components/pdf/pages/.
```

---

### Prompt 2 — Page 1 Cover (DB + static)

```
Port care_model_pdf/1/code/index.html to src/components/pdf/pages/PdfCoverPage.tsx.

Props:
- projectName: string (from projects.name)
- orgLogoUrl?: string (from CoverDetails.orgLogoDataUrl)
- coverPhotoUrl?: string (from CoverDetails.coverPhotoDataUrl)
- date: string (formatted "MONTH YEAR")

Keep all CSS from care_model_pdf/1/code/styles.css inline or as a module.
Replace hardcoded "PATIENTS NOT PRISONERS" with projectName.
Use a default Measure logo if orgLogoUrl is missing.
Fix the bug where buildCoverPage() ignores CoverDetails when the static PNG loads.
```

---

### Prompt 3 — Pages 2–3 (static — no changes)

```
Pages 2 and 3 remain full-bleed static JPEGs already in pdfStaticPage2.ts and
pdfStaticPage3.ts. Do not render HTML for these. Use:
doc.addImage(PDF_STATIC_PAGE_2, 'JPEG', 0, 0, pageWidth, pageHeight)
doc.addImage(PDF_STATIC_PAGE_3, 'JPEG', 0, 0, pageWidth, pageHeight)
```

---

### Prompt 4 — Page 4 Executive Summary (AI narrative)

```
Port care_model_pdf/4/code/index.html to PdfExecutiveSummary.tsx.

Props:
- bodyParagraphs: string[] (split from AI ## Executive Summary section)
- leaderName?: string (from project_members care_team_leader profile)
- leaderTitle?: string
- leaderPhotoUrl?: string
- pageNumber: 5
- date: string

Render each paragraph in .body-text slots. If bodyParagraphs is empty, show:
"This section will be developed in upcoming sessions."

Auto-shrink font size from 11pt down to 8pt until all content fits one page.
```

---

### Prompt 5 — Page 5 Summary + Metrics (AI + DB + static icons)

```
Port care_model_pdf/5/code/index.html to PdfSummaryMetrics.tsx.

Props:
- mission: string (AI ## Mission — grounded in organizations.mission)
- communityQuote: { text: string, name: string, title: string }
- solutions: string[] (AI ## Solutions bullets)
- metrics: { title: string, description: string }[] (from Session 10 via AI structured output)
- pageNumber: number
- date: string

Copy SVG icons from care_model_pdf/5/code/assets/ to src/assets/pdf/.
CIM ID icon row is static layout — only metric descriptions are dynamic.
Max 3 metrics. Max 4 solution bullets.
```

---

### Prompt 6 — Page 6 Problem (AI + static illustration)

```
Port care_model_pdf/6/code/index.html to PdfProblemPage.tsx.

Props:
- problemStatement: string (AI ## Problem section)
- coverPhotoUrl?: string (optional community photo — fallback to placeholder)
- pageNumber: 9
- date: string

Copy minds-illustration.svg to src/assets/pdf/. Illustration is static.
Problem text comes from AI. Auto-fit text to one page.
```

---

### Prompt 7 — Page 7 Population + Timeline (AI + hybrid map)

```
Port care_model_pdf/7/code/index.html to PdfPopulationPage.tsx.

Props:
- populationText: string[] (AI ## Population Served paragraphs)
- location: string (organizations.location — shown near map)
- timelineIntro: string (AI from Session 3)
- timelineEvents: { year?: string, label: string }[] (AI structured from Session 3)
- pageNumber: 7

Use florida-map.svg as generic map placeholder. Overlay location text from DB.
Render a simple horizontal timeline from timelineEvents array (max 5 events).
If no events, show static timeline-thumb.svg placeholder.
```

---

### Prompt 8 — Page 8 Community Impact Tree (AI structured + static SVG)

```
Port care_model_pdf/8/code/index.html to PdfImpactTreePage.tsx.

Props:
- intro: string (AI synthesized from Sessions 1+2)
- tree: { center: string, branches: { label: string, sublabel?: string }[] }
- pageNumber: 8

Use community-impact-tree.svg as background. Overlay dynamic text at node positions.
Max 6 branches. If tree.center is empty, show placeholder text.
```

---

### Prompt 9 — Page 9 Stakeholder table (AI structured)

```
Port care_model_pdf/9/code/index.html to PdfStakeholderPage.tsx.

Props:
- stakeholders: { group: string, role: string, engagement: string }[]
- pageNumber: 8

Top 3 intro paragraphs are STATIC boilerplate (copy from HTML).
Table rows are dynamic from AI structured output parsing Session 4 artifacts.
Max 3 rows. If empty, show one placeholder row:
"TBD — complete Session 4 (Invested Parties) to populate this table."
```

---

### Prompt 10 — Page 10 Data Collection table (DB + AI)

```
Port care_model_pdf/10/code/index.html to PdfDataCollectionPage.tsx.

Props:
- rows: { dataNeeded: string, howToCollect: string, whoWillCollect: string }[]
- pageNumber: 11

Intro paragraphs are STATIC. Table rows from AI structured output
parsing Sessions 5+11 artifacts. Max 4 rows.
```

---

### Prompt 11 — Page 11 Asset Mapping (DB + gauge)

```
Port care_model_pdf/11/code/index.html to PdfAssetMappingPage.tsx.

Props:
- rows: { component: string, score: number, priority: string, solution: string }[]
- averageScore: number (0-5)
- pageNumber: 11

Copy gauge.svg to src/assets/pdf/. Rotate gauge needle based on averageScore.
Table from Session 6 via AI structured output. Max 3 rows.
```

---

### Prompt 12 — Extend AI edge function

```
Update supabase/functions/generate-strategic-plan/index.ts to return:

{
  narrative: string,  // existing 9 ## markdown sections
  structured: {
    stakeholders: { group, role, engagement }[],
    dataCollection: { dataNeeded, howToCollect, whoWillCollect }[],
    assetMapping: { component, score, priority, solution }[],
    metrics: { title, description }[],
    impactTree: { center: string, branches: { label, sublabel? }[] },
    timeline: { year?: string, label: string }[],
    communityQuote: { text: string, attribution: string }
  }
}

Add a second Gemini call OR ask for JSON after the markdown sections.
Parse Session 4, 5, 6, 10, 11 artifacts into structured fields.
Never fabricate data — return empty arrays if session has no worksheet input.
Keep per-section 280 word limit for narrative sections.
```

---

### Prompt 13 — New pages (TOC, Action Items, Team, Closing)

```
Create four new PDF page components:

PdfTocPage.tsx — GENERATED
- List all 15 section titles with page numbers and dotted leaders
- Navy banner header "Table of Contents", page 4

PdfActionItemsPage.tsx — DB
- Props: sessions: { session_number, session_name, next_steps }[]
- Group by session. Page 12. Placeholder if no next_steps.

PdfTeamPage.tsx — DB
- Props: teamMembers: { full_name, email, role }[]
- Group into CARE Team Leaders and Members. Page 14.

PdfClosingPage.tsx — STATIC + DB
- Thank you paragraph with organizations.name and organizations.location
- Static MEASURE contact info (wemeasure.org). Page 15.
```

---

### Prompt 14 — Wire export flow

```
Update ProjectDetail.tsx handleExportGuide("polished") to:
1. Call generate-strategic-plan — expect { narrative, structured }
2. Pass both to generateProjectPdfPreview()
3. Update PdfPreviewDialog to show iframe PDF preview for polished mode
   (not raw markdown)

Update generateProjectPdfPreview() and PdfBuilder.build() to:
1. Render each of 15 pages via PdfPageRenderer + React components
2. Pass narrative sections and structured JSON to the right page components
3. Enforce exactly 15 pages — throw/warn if count is wrong
```

---

## Implementation Phases & ETA

| Phase | Work | Days |
|-------|------|------|
| 1 | Static pages 1–3 + html2canvas pipeline | 1–2 |
| 2 | AI narrative pages 4, 6, 7 | 2–3 |
| 3 | Extend AI for structured JSON | 1–2 |
| 4 | Table pages 9, 10, 11 | 2–3 |
| 5 | Diagram page 8 + combined page 5 | 2–3 |
| 6 | New pages: TOC, Action Items, Team, Closing | 1–2 |
| 7 | Preview polish + testing | 1–2 |
| **Total** | | **10–17 days** |

---

## Quick Reference — Source Type Per Page

| Page | Section | Static | DB | AI |
|------|---------|--------|----|----|
| 1 | Cover | Branding, labels | project name, logo, photo, date | — |
| 2 | Letter | 100% | — | — |
| 3 | About Measure | 100% | — | — |
| 4 | Table of Contents | Layout | — | Generated |
| 5 | Executive Summary | Layout, footer | leader name, date | Body text |
| 6 | Mission & Vision | Layout, CIM icons | org mission | Mission, quote, solutions, metrics |
| 7 | Community Context | Map template | location | Population, timeline |
| 8 | Stakeholders | Intro text, layout | — | Table rows |
| 9 | Problem | Illustration, layout | photo (optional) | Problem statement |
| 10 | Solutions | Layout | — | Solutions list |
| 11 | Implementation | Intro text, gauge SVG | — | Data + asset tables |
| 12 | Action Items | Layout | next_steps | — |
| 13 | Measurement | Layout | — | Metrics prose |
| 14 | Team | Layout | project_members | — |
| 15 | Closing | Contact info | org name, location | — |

---

*Last updated: June 2025*
