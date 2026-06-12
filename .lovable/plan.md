## Facilitator Training Academy

A guided, modular learning path that onboards new facilitators to community-based facilitation and the WeMeasure platform. Learners progress through levels, complete lessons + checks, and earn certificates as they level up.

### What the user gets

- A new **Training Academy** section in the sidebar (`/academy`)
- An **overview dashboard** showing levels, progress %, badges earned, next lesson CTA
- **4 levels (modules)**, each unlocked by completing the previous one:
  1. **Foundations of Community Facilitation** — what facilitation is, the 3 C's (Credit, Consent, Compensation), values-based icebreakers, creating brave space
  2. **The CARE Model & TIR** — 12-meeting arc, Theory of Interrogative Reasoning (3 questions, 5 tenets), anti-bias datasets
  3. **Using the WeMeasure Platform** — projects, sessions, the 5-step workflow (Watch, Fill, Ask AI, Interrogate, Refine), auto-save, completion tracking, inviting your CARE Team
  4. **Advanced Facilitation & Data Stewardship** — handling tough conversations, AI Acceptable Use, Data Contribution opt-in, exporting Mobilization Guides, fallback to printable worksheets
- Each level contains **3–5 lessons**. Each lesson is one guided page with: learning objectives, short content sections, embedded examples/screens, and a **5-question knowledge check** at the end (multiple choice). Pass = 80%.
- A **certificate** is awarded when all lessons + final assessment in a level pass. Certificates are downloadable PDFs, MEASURE-branded, with learner name, level title, completion date, and a verification ID.
- A **Certificates wall** on the academy home shows earned + locked badges.

### UX flow

```text
/academy (overview)
  ├── Progress bar + "Continue where you left off"
  ├── Level cards (locked/in-progress/complete) with badge art
  └── My Certificates strip

/academy/level/:levelId (level overview)
  ├── Level intro, learning outcomes
  ├── Lesson list with checkmarks
  └── Final Assessment (unlocked when all lessons done)

/academy/lesson/:lessonId (guided lesson)
  ├── Sticky progress bar (Lesson X of Y in Level Z)
  ├── Sectioned content (intro → core concepts → platform walkthrough → recap)
  ├── "Mark section complete" buttons that step through
  └── Knowledge check (5 Qs) → pass shows confetti + Next Lesson CTA

/academy/certificate/:certificateId (printable view + download)
```

### Data model (new tables)

- `academy_progress` — per user, per lesson: status (not_started | in_progress | completed), score, completed_at
- `academy_certificates` — per user, per level: level_id, awarded_at, verification_code, score
- Lesson + level content lives in `src/config/academyContent.ts` (no DB needed for content — keeps it editable and versionable)

RLS: users can read/write their own progress and certificates only; admins can view all.

### Technical notes

- New route group under `/academy/*` wrapped in `AuthGuard`
- Reuse `DashboardLayout`, `StepCard`, `Card`, `Progress`, `RadioGroup`, `Badge`, shadcn primitives
- Certificate PDF generated client-side with `jspdf` (already used elsewhere) — branded with MEASURE logo, navy `#253B96`, gold `#F9D448`, Outfit/Liberation Sans fallback
- Sidebar: add "Training Academy" link with `GraduationCap` icon, visible to all authenticated users
- Lesson content authored in TS as structured objects so we can later add videos, images, and interactive checks without schema changes
- Knowledge check answers stored alongside questions; grading happens client-side, score persisted to `academy_progress`
- Use Lovable AI (gemini-2.5-flash) later for an optional "Ask the Coach about this lesson" — out of scope for v1

### What's in v1 vs later

**v1 (this build):**
- 4 levels, ~14 lessons total with real content
- Knowledge checks + scoring
- Progress persistence
- Downloadable PDF certificates
- Sidebar entry + academy dashboard

**Future:**
- Video lessons per module
- Peer-reviewed practical assessments
- Public certificate verification page
- Coach chatbot scoped to lesson context

### File changes

- New: `src/pages/Academy.tsx`, `AcademyLevel.tsx`, `AcademyLesson.tsx`, `AcademyCertificate.tsx`
- New: `src/components/academy/LevelCard.tsx`, `LessonProgress.tsx`, `KnowledgeCheck.tsx`, `CertificateBadge.tsx`
- New: `src/config/academyContent.ts` (all lesson content)
- New: `src/utils/generateCertificate.ts`
- Edit: `src/App.tsx` (routes), `src/components/AppSidebar.tsx` (nav link)
- Migration: `academy_progress`, `academy_certificates` tables + RLS
