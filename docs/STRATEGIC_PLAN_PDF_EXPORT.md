# Strategic Plan PDF Export — Project Documentation

This document explains the **Strategic Plan PDF export** feature in the CARE Model app: what the client is asking for, how the system works, why exports may appear empty, and where the code lives.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [What This Job Is (and Is Not)](#what-this-job-is-and-is-not)
3. [Reference PDF vs. Generated PDF](#reference-pdf-vs-generated-pdf)
4. [End-to-End Pipeline](#end-to-end-pipeline)
5. [15-Page Specification](#15-page-specification)
6. [Where the Code Lives](#where-the-code-lives)
7. [Client Requirements](#client-requirements)
8. [What Is Broken Today](#what-is-broken-today)
9. [Why an Export May Look Empty](#why-an-export-may-look-empty)
10. [Acceptance Criteria](#acceptance-criteria)
11. [Estimated Timeline](#estimated-timeline)
12. [Client Confirmation Template](#client-confirmation-template)
13. [Prerequisites for Testing](#prerequisites-for-testing)

---

## Executive Summary

The Strategic Plan export is **not** a job to reformat an existing PDF. It is a **data → AI → PDF pipeline** that:

1. Reads project data from Supabase (sessions, artifacts, team members).
2. Uses an AI edge function to synthesize raw worksheet inputs into polished narrative sections.
3. Renders a fixed **15-page**, letter-size, branded PDF using jsPDF on the client.

The reference PDF shared by the client (*2024 Patients Not Prisoners Community Mobilization Guide*) is a **visual benchmark** — it shows what a finished deliverable should look like. Each user's export must be generated fresh from **their** project's data.

---

## What This Job Is (and Is Not)

| In scope | Out of scope |
|----------|--------------|
| Build/fix the PDF generation pipeline in the app | Manually edit or fill in the reference PDF |
| Pull data from Supabase and synthesize with AI | Copy Patients Not Prisoners content into other projects |
| Match the reference guide's layout and branding | Static PDF templating per organization |
| Enforce exactly 15 pages, one section per page | Long continuous scroll-style PDF |

---

## Reference PDF vs. Generated PDF

**Reference file:** `2024Patients Not Prisoners Community Mobilization Guide-3.pdf`

- ~18 pages of rich content for one real organization (Patients Not Prisoners).
- That content exists because the org completed CARE Model sessions and their worksheet data was synthesized into a polished guide.
- The client uses this file to say: *"Make our app's export look this professional."*

**Generated PDF (per project):**

- Created dynamically when a user clicks **Export Guide → Strategic Plan** on `/project/:id`.
- Content comes from **that project's** database records and AI synthesis — not from the reference file.

---

## End-to-End Pipeline

```
User clicks "Export Strategic Plan"
        │
        ▼
Load project data from Supabase
  (sessions, artifacts, notes, interrogations, project_members)
        │
        ▼
Edge function: generate-strategic-plan
  (Gemini synthesizes 9 narrative ## sections)
        │
        ▼
PDF builder: exportProjectPdf.ts (mode: "polished")
  (jsPDF renders 15-page branded document)
        │
        ▼
Preview dialog → Download PDF
```

### Data sources by page type

| Content type | Source |
|--------------|--------|
| Cover (project name, org, date) | Database — `projects`, `organizations` |
| Pages 2–3 (branded static pages) | Pre-made JPEG assets in repo |
| Table of Contents | Generated in PDF builder |
| Narrative sections (Executive Summary through Measurement) | **AI** — `generate-strategic-plan` edge function |
| Action Items | **Database** — `sessions.next_steps` |
| Team roster | **Database** — `project_members` + `profiles` |
| Closing / Contact | Static template in PDF builder |

---

## 15-Page Specification

Required final output: **exactly 15 pages**, Letter size, portrait.

| Page | Section | Content source |
|------|---------|----------------|
| 1 | Cover | Project name, organization, date, Measure logo, CARE Model branding |
| 2 | Letter of Acknowledgment | Full-bleed branded image — `PDF_STATIC_PAGE_2` |
| 3 | About Measure & The CARE Model | Full-bleed branded image — `PDF_STATIC_PAGE_3` |
| 4 | Table of Contents | Generated from sections |
| 5 | Executive Summary | AI narrative — `## Executive Summary` |
| 6 | Organization Mission & Vision | AI narrative — `## Mission` |
| 7 | Community Context & Assessment (Phase 1 synthesis) | AI narrative — `## Assessment` |
| 8 | Stakeholder Analysis | AI narrative — `## Stakeholders` |
| 9 | Root Cause & Problem Framing | AI narrative — `## Problem` |
| 10 | Proposed Solutions (Phase 2 synthesis) | AI narrative — `## Solutions` |
| 11 | Implementation Roadmap (Phase 3 synthesis) | AI narrative — `## Implementation` |
| 12 | Action Items & Next Steps | Consolidated from all sessions' `next_steps` (DB) |
| 13 | Measurement & Success Indicators | AI narrative — `## Measurement` |
| 14 | Team & Acknowledgments | Project team roster (DB — `project_members`) |
| 15 | Closing / Call to Action / Contact | Static branded content |

### Layout rules

- **One section per page.** No section flows across multiple pages without an explicit page break.
- If content overflows, reduce font size or trim — never let two sections share a page.
- **Pages 2–3:** Full-bleed images only — no margins, header, or footer.
  ```js
  doc.addImage(PDF_STATIC_PAGE_2, 'JPEG', 0, 0, pageWidth, pageHeight);
  ```
- **Pages 4–15:** Navy banner header (`#253B96`) with white section title in Outfit font; footer with Measure wordmark (left) and page number (right).
- **Typography:** Outfit for headings; system serif/sans for body. Body text 11pt, line height 1.5, margins 0.75".
- **Colors:** Primary `#253B96`, accent `#E8973E`, secondary `#F9D448`. No other colors in chrome.
- **Missing AI sections:** Render placeholder text — *"This section will be developed in upcoming sessions."* — do not skip the page.
- **File size:** Under 5 MB.

### AI narrative sections

The edge function must return markdown with these exact `##` headings (9 sections, ~250–350 words each):

1. `## Executive Summary`
2. `## Mission`
3. `## Assessment`
4. `## Stakeholders`
5. `## Problem`
6. `## Solutions`
7. `## Implementation`
8. `## Measurement`

*(Note: Action Items, Team, and Closing are assembled in the PDF builder from DB/static sources, not from AI.)*

---

## Where the Code Lives

| Component | Path | Role |
|-----------|------|------|
| PDF generator | `src/utils/exportProjectPdf.ts` | Class-based jsPDF builder; `generateProjectPdfPreview()` entry point; `mode: "polished"` branch |
| Static page 2 | `src/utils/pdfStaticPage2.ts` | Base64 JPEG — Letter of Acknowledgment |
| Static page 3 | `src/utils/pdfStaticPage3.ts` | Base64 JPEG — About Measure & CARE Model |
| AI narrative | `supabase/functions/generate-strategic-plan/index.ts` | Returns narrative markdown split by `##` headings |
| Export trigger | `src/pages/ProjectDetail.tsx` | `handleExportGuide("polished")` |
| Preview dialog | `src/components/project/PdfPreviewDialog.tsx` | Preview before download |

### Key functions in `exportProjectPdf.ts`

| Function | Purpose |
|----------|---------|
| `build()` | Main entry — cover, static pages 2–3, then polished or draft flow |
| `renderStrategicPlanFixed16()` | Newer fixed-layout path (one section per page) |
| `renderPaginatedNarrative()` | Older path — splits on `##` but does **not** enforce one page per section |
| `generateProjectPdfPreview()` | Public API used by `ProjectDetail.tsx` |

Polished mode only uses the full fixed layout when AI narrative is present:

```ts
if (this.mode === "polished" && narrative && narrative.trim()) {
  this.renderStrategicPlanFixed16(project, sessions, narrative, teamMembers);
  return this.doc;
}
```

Without narrative, the builder falls back to the older draft-style continuous layout.

---

## Client Requirements

From the client email (Carpe Diem / MEASURE CARE Model):

1. Replace the current "one long continuous page of text" with a **properly paginated, 15-page branded PDF**.
2. Match the visual quality of the Patients Not Prisoners reference guide.
3. Implement missing pages: Table of Contents, Action Items consolidation, Team page, Closing page.
4. Fix AI prompt so Gemini returns all 9 narrative sections with consistent `##` headings.
5. Enforce strict pagination and branded headers/footers on content pages.

---

## What Is Broken Today

| Issue | Detail |
|-------|--------|
| Pagination | `renderPaginatedNarrative()` splits by `##` but long sections still flow across pages |
| AI headings | Edge function does not always return consistent `##` headings; sections collapse |
| Missing pages | No Table of Contents, Action Items, Team, or Closing in the broken export path |
| Visual quality | Pages 2–3 images exist, but remaining pages do not match reference "magazine" quality |
| Page count mismatch | Current repo implementation targets 16 pages with slightly different section names vs. client's 15-page spec |

---

## Why an Export May Look Empty

If the exported PDF shows only a cover or headings with no body text, common causes are:

### 1. No or minimal session data

If facilitators have not completed worksheets, the AI has little to synthesize. Sections fall back to:

> *"This section will be developed in upcoming sessions."*

### 2. AI edge function failure

The `generate-strategic-plan` function requires:

- `LOVABLE_API_KEY` configured in Supabase edge function secrets
- Function deployed to Supabase
- Valid user auth token (RLS enforced)

If the function fails, `ProjectDetail.tsx` shows an error toast and may not produce a polished PDF.

### 3. Broken pagination path

The legacy `renderPaginatedNarrative()` path does not enforce one section per page, which can make output look sparse or misaligned.

### 4. Inconsistent AI section headings

If Gemini returns `## Our Mission` instead of `## Mission`, the parser may miss content unless alias normalization runs (partially implemented in the edge function).

### 5. Polished mode requires narrative

The full 15/16-page layout only runs when `narrative` is non-empty. Without it, the app uses the draft-style flow — often a single long page, matching the client's description of the bug.

---

## Acceptance Criteria

- [ ] Download the PDF for any project with **≥1 completed session**
- [ ] Open in Preview/Acrobat → confirm **exactly 15 pages** in the order specified above
- [ ] Pages 2 and 3 are branded reference images, edge-to-edge
- [ ] Every other content page (4–15) has navy banner header + footer
- [ ] No section overflows or is cut off mid-page
- [ ] File size under 5 MB

---

## Estimated Timeline

| Scenario | Estimate |
|----------|----------|
| Edge function + DB data working; mostly PDF layout and prompt tuning | **3–5 working days** |
| Edge function/env not set up, sparse test data, full visual polish vs. reference | **1–2 weeks** |

### Breakdown

| Task | Estimate |
|------|----------|
| PDF layout to exact 15-page spec | 2–3 days |
| AI prompt + heading normalization | 0.5–1 day |
| TOC / Action Items / Team / Closing pages | ~1 day (partially started in repo) |
| Visual polish vs. reference guide | 1–2 days |
| Testing with real project data | 0.5–1 day |

---

## Client Confirmation Template

Use this when replying to the client to confirm scope:

> **Confirmed:** We will implement a per-project Strategic Plan export that (1) reads session/artifact data and team info from Supabase, (2) uses the `generate-strategic-plan` edge function to produce nine AI narrative sections, and (3) renders a fixed **15-page**, letter-size, branded PDF via `exportProjectPdf.ts` — visually aligned with the Patients Not Prisoners reference guide.
>
> The reference PDF is a **design benchmark**, not a document to reformat. Pages 2–3 remain static branded assets; narrative pages are AI-synthesized from project data; Action Items come from `next_steps`; Team from `project_members`; Closing is static branded content.

---

## Prerequisites for Testing

Before validating or demoing the export:

1. **Project with ≥1 completed session** and real worksheet/artifact content.
2. **Supabase edge function deployed:** `supabase functions deploy generate-strategic-plan`
3. **Environment secrets:** `LOVABLE_API_KEY` set in Supabase (not only in local `.env` for the edge function).
4. **Verify AI output:** Call `generate-strategic-plan` and confirm the response includes a full `narrative` with all `##` sections.
5. **Verify PDF:** Export in polished mode and confirm 15 pages with body text on pages 5+.

### Quick verification checklist

```
[ ] generate-strategic-plan returns { narrative: "## Executive Summary\n\n..." }
[ ] Narrative contains all 9 required ## headings
[ ] PDF preview shows 15 pages (not 1 long scroll)
[ ] Pages 2–3 are full-bleed images
[ ] Pages 4–15 have navy header + footer
[ ] Action Items page lists session next_steps
[ ] Team page lists project_members
```

---

## Related Files

```
src/
  utils/
    exportProjectPdf.ts      # Main PDF builder
    pdfStaticPage2.ts        # Page 2 image asset
    pdfStaticPage3.ts        # Page 3 image asset
  pages/
    ProjectDetail.tsx        # Export trigger
  components/
    project/
      PdfPreviewDialog.tsx   # Preview UI

supabase/
  functions/
    generate-strategic-plan/
      index.ts               # AI synthesis edge function
```

---

*Last updated: June 2025*
