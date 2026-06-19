import jsPDF from "jspdf";
import { getSessionContent } from "@/config/sessionContent";
import { MEASURE_ICON_BASE64 } from "@/utils/measureIconBase64";
import { COVER_MOBILIZATION_GUIDE_BASE64 } from "@/utils/coverMobilizationGuideBase64";
import { FOUNDER_PHOTO_BASE64, BLUE_CUBE_BASE64 } from "@/utils/letterAssets";
import { DANCING_SCRIPT_BASE64 } from "@/utils/dancingScriptFont";
import { OUTFIT_REGULAR_BASE64 } from "@/utils/outfitRegularFont";
import { OUTFIT_BOLD_BASE64 } from "@/utils/outfitBoldFont";
import { PDF_STATIC_PAGE_2 } from "@/utils/pdfStaticPage2";
import { PDF_STATIC_PAGE_3 } from "@/utils/pdfStaticPage3";
import {
  formatCoverDate,
  renderPdfCoverPageToDataUrl,
} from "@/utils/renderPdfCoverPage.tsx";
import { renderPdfExecutiveSummaryPageToDataUrl } from "@/utils/renderPdfExecutiveSummaryPage.tsx";
import { renderPdfMissionVisionPageToDataUrl } from "@/utils/renderPdfMissionVisionPage.tsx";
import { renderPdfCommunityAssessmentPageToDataUrl } from "@/utils/renderPdfCommunityAssessmentPage.tsx";
import { renderPdfProblemFramingPageToDataUrl } from "@/utils/renderPdfProblemFramingPage.tsx";
import { renderPdfStakeholderAnalysisPageToDataUrl } from "@/utils/renderPdfStakeholderAnalysisPage.tsx";
import { renderPdfProposedSolutionsPageToDataUrl } from "@/utils/renderPdfProposedSolutionsPage.tsx";
import { renderPdfImplementationRoadmapPageToDataUrl } from "@/utils/renderPdfImplementationRoadmapPage.tsx";
import { renderPdfMeasurementPageToDataUrl } from "@/utils/renderPdfMeasurementPage.tsx";
import { renderPdfTeamPageToDataUrl } from "@/utils/renderPdfTeamPage.tsx";
import { renderPdfClosingPageToDataUrl } from "@/utils/renderPdfClosingPage.tsx";

// Brand colors (MEASURE brand)
const COLORS = {
  darkCornflower: [37, 59, 150] as [number, number, number],
  tigersEye: [232, 151, 62] as [number, number, number],
  gargoyleGas: [249, 212, 72] as [number, number, number],
  measureBlue: [0, 8, 96] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  lightGray: [245, 245, 248] as [number, number, number],
  midGray: [120, 120, 130] as [number, number, number],
  darkText: [30, 30, 40] as [number, number, number],
  bodyText: [50, 50, 60] as [number, number, number],
  accent: [30, 120, 70] as [number, number, number],
};

interface ExportSession {
  id: string;
  session_number: number;
  session_name: string;
  status: string;
  completed_at: string | null;
  notes: string | null;
  next_steps: string | null;
}

interface ExportProject {
  id: string;
  name: string;
  data_donation_consent: boolean;
  organizations: { name: string; location: string; mission: string };
}

interface ExportArtifact {
  session_id: string | null;
  artifact_type: string;
  content: Record<string, any>;
}

interface ExportInterrogation {
  session_id: string;
  mode: string;
  challenge_tags: string[];
  model_output: string;
  verdict: string | null;
  model_revision: string | null;
  model_rationale: string | null;
  affected_groups: string[];
}

export type PdfMode = "draft" | "polished";

export interface CoverDetails {
  facilitatorName?: string;
  orgLogoDataUrl?: string; // data URI (image/png, image/jpeg)
  coverPhotoDataUrl?: string; // data URI for the hero cover photo
  date?: string; // optional override; defaults to today
}

export interface TeamMember {
  full_name: string | null;
  email: string;
  role: string; // project_role: care_team_leader | care_team_member
}


class PdfBuilder {
  private doc: jsPDF;
  private y: number;
  private pageWidth: number;
  private pageHeight: number;
  private margin = 54;
  private contentWidth: number;
  private pageNum = 1;
  private mode: PdfMode = "draft";
  private spCover?: CoverDetails;

  constructor() {
    this.doc = new jsPDF({ unit: "pt", format: "letter" });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.contentWidth = this.pageWidth - this.margin * 2;
    this.y = this.margin;

    // Register Dancing Script cursive font for signature
    this.doc.addFileToVFS("DancingScript.ttf", DANCING_SCRIPT_BASE64);
    this.doc.addFont("DancingScript.ttf", "DancingScript", "normal");

    // Register Outfit (MEASURE brand font) — used by the fixed 15-page Strategic Plan
    this.doc.addFileToVFS("Outfit-Regular.ttf", OUTFIT_REGULAR_BASE64);
    this.doc.addFont("Outfit-Regular.ttf", "Outfit", "normal");
    this.doc.addFileToVFS("Outfit-Bold.ttf", OUTFIT_BOLD_BASE64);
    this.doc.addFont("Outfit-Bold.ttf", "Outfit", "bold");
  }

  private checkPage(needed: number) {
    if (this.y + needed > this.pageHeight - 70) {
      this.addFooter();
      this.addPageNumber();
      this.doc.addPage();
      this.pageNum++;
      this.y = this.margin;
    }
  }

  // Top-right "PAGE | N" marker — matches reference guide
  private addPageNumber() {
    if (this.pageNum <= 1) return; // no marker on cover
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(...COLORS.darkCornflower);
    this.doc.text(
      `PAGE | ${this.pageNum - 1}`,
      this.pageWidth - this.margin,
      this.margin - 18,
      { align: "right" }
    );
  }

  // Bottom navy rule + month/year — matches reference guide
  private addFooter() {
    if (this.pageNum <= 1) return; // no footer on cover
    const footerY = this.pageHeight - 36;
    this.doc.setDrawColor(...COLORS.darkCornflower);
    this.doc.setLineWidth(1.5);
    this.doc.line(this.margin, footerY - 14, this.pageWidth - this.margin, footerY - 14);
    this.doc.setFontSize(9);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...COLORS.darkCornflower);
    const dateLabel = new Date().toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    }).toUpperCase();
    this.doc.text(dateLabel, this.margin, footerY);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(...COLORS.midGray);
    this.doc.text("CARE MODEL  •  STRATEGIC PLAN", this.pageWidth - this.margin, footerY, { align: "right" });
  }

  private text(
    str: string,
    size: number,
    style: "normal" | "bold" | "italic" | "bolditalic" = "normal",
    color: [number, number, number] = COLORS.darkText,
    maxW?: number
  ) {
    this.doc.setFontSize(size);
    this.doc.setFont("helvetica", style);
    this.doc.setTextColor(...color);
    const w = maxW ?? this.contentWidth;
    const lines: string[] = this.doc.splitTextToSize(str, w);
    const lineHeight = size * 1.45;
    for (const line of lines) {
      this.checkPage(lineHeight);
      this.doc.text(line, this.margin, this.y);
      this.y += lineHeight;
    }
  }

  private textAt(
    str: string,
    x: number,
    size: number,
    style: "normal" | "bold" | "italic" | "bolditalic" = "normal",
    color: [number, number, number] = COLORS.darkText,
    maxW?: number
  ) {
    this.doc.setFontSize(size);
    this.doc.setFont("helvetica", style);
    this.doc.setTextColor(...color);
    const w = maxW ?? (this.pageWidth - this.margin - x);
    const lines: string[] = this.doc.splitTextToSize(str, w);
    const lineHeight = size * 1.45;
    for (const line of lines) {
      this.checkPage(lineHeight);
      this.doc.text(line, x, this.y);
      this.y += lineHeight;
    }
  }

  private gap(g: number) {
    this.y += g;
  }

  // ── Markdown-aware renderer ──
  // Strips raw markdown noise and renders headings (# / ## / ###), bullet lists,
  // numbered lists, and plain paragraphs. Inline **bold** markers are stripped
  // (jsPDF cannot mix styles on a single wrapped line cleanly); whole-line bold
  // is best expressed as a heading.
  private renderMarkdown(
    md: string,
    opts?: { size?: number; color?: [number, number, number] }
  ) {
    if (!md || !md.trim()) return;
    const size = opts?.size ?? 9;
    const color = opts?.color ?? COLORS.bodyText;

    // Unwrap an outer ```markdown ... ``` fence if the AI wrapped the whole document
    let pre = md.replace(/\r\n/g, "\n").trim();
    const outerFence = pre.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n?```\s*$/i);
    if (outerFence) pre = outerFence[1].trim();

    const cleaned = pre
      .replace(/```[\s\S]*?```/g, "") // strip remaining code fences
      .replace(/`([^`]+)`/g, "$1") // inline code → plain
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // strip images
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links → label only
      .trim();

    const blocks = cleaned.split(/\n{2,}/);
    for (const block of blocks) {
      const blockLines = block.split("\n").map((l) => l.replace(/\s+$/, ""));
      // Heading on first line?
      const first = blockLines[0] ?? "";
      const hMatch = first.match(/^(#{1,3})\s+(.+)$/);
      if (hMatch) {
        const level = hMatch[1].length;
        const headSize = level === 1 ? size + 5 : level === 2 ? size + 3 : size + 1;
        this.gap(4);
        this.text(hMatch[2].replace(/\*\*/g, ""), headSize, "bold", COLORS.darkCornflower);
        this.gap(2);
        const rest = blockLines.slice(1).filter((l) => l.trim());
        if (rest.length) this.renderListOrPara(rest, size, color);
        this.gap(4);
        continue;
      }
      this.renderListOrPara(blockLines, size, color);
      this.gap(4);
    }
  }



  // Render the AI narrative with one ## section per page, each opening with
  // a branded banner header — produces the multi-page magazine feel of the
  // reference Community Mobilization Guide.
  private renderPaginatedNarrative(md: string) {
    let pre = md.replace(/\r\n/g, "\n").trim();
    const outerFence = pre.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n?```\s*$/i);
    if (outerFence) pre = outerFence[1].trim();

    // Strip a leading # H1 (document title) — we don't need it; the cover handles that.
    pre = pre.replace(/^\s*#\s+[^\n]+\n+/, "");

    // Split on H2 boundaries while keeping the heading text.
    const parts = pre.split(/\n(?=##\s)/);
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const m = trimmed.match(/^##\s+(.+?)\n([\s\S]*)$/);
      const title = m ? m[1].trim() : "Strategic Plan";
      const body = m ? m[2].trim() : trimmed;

      // New page + banner for each section
      this.addFooter();
      this.addPageNumber();
      this.doc.addPage();
      this.pageNum++;
      this.y = this.margin;
      this.bannerHeader(title);
      this.renderMarkdown(body, { size: 10.5 });
    }
  }

  private renderListOrPara(
    lines: string[],
    size: number,
    color: [number, number, number]
  ) {
    const nonEmpty = lines.filter((l) => l.trim());
    if (!nonEmpty.length) return;
    const isList = nonEmpty.every((l) => /^\s*([-*•]|\d+\.)\s+/.test(l));
    const lh = size * 1.45;

    if (isList) {
      for (const raw of nonEmpty) {
        const cleaned = raw
          .replace(/^\s*([-*•]|\d+\.)\s+/, "")
          .replace(/\*\*/g, "")
          .replace(/__/g, "")
          .trim();
        if (!cleaned) continue;
        this.checkPage(lh + 2);
        this.doc.setFontSize(size);
        this.doc.setFont("helvetica", "bold");
        this.doc.setTextColor(...color);
        this.doc.text("•", this.margin + 4, this.y);
        this.doc.setFont("helvetica", "normal");
        const wrapped: string[] = this.doc.splitTextToSize(cleaned, this.contentWidth - 18);
        for (let i = 0; i < wrapped.length; i++) {
          this.checkPage(lh);
          this.doc.text(wrapped[i], this.margin + 16, this.y);
          this.y += lh;
        }
        this.gap(2);
      }
      return;
    }

    const para = nonEmpty.join(" ").replace(/\*\*/g, "").replace(/__/g, "");
    this.text(para, size, "normal", color);
  }

  private roundedBox(
    x: number,
    yStart: number,
    w: number,
    h: number,
    fill: [number, number, number],
    border?: [number, number, number]
  ) {
    this.doc.setFillColor(...fill);
    if (border) {
      this.doc.setDrawColor(...border);
      this.doc.setLineWidth(1);
      this.doc.roundedRect(x, yStart, w, h, 6, 6, "FD");
    } else {
      this.doc.roundedRect(x, yStart, w, h, 6, 6, "F");
    }
  }

  private sectionHeader(title: string) {
    this.checkPage(40);
    this.doc.setFillColor(...COLORS.darkCornflower);
    this.doc.rect(this.margin, this.y, 4, 18, "F");
    this.doc.setFontSize(15);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...COLORS.darkCornflower);
    this.doc.text(title, this.margin + 14, this.y + 14);
    this.y += 30;
  }

  // Full-width navy banner with large white title — page-opening header
  // that matches the reference guide (Executive Summary, Conclusion, etc.)
  private bannerHeader(title: string, opts?: { accent?: boolean }) {
    // Banner spans full page width, sits at the very top.
    // Caller is responsible for placing this at the start of a fresh page.
    const bannerH = 130;
    this.doc.setFillColor(...COLORS.darkCornflower);
    this.doc.rect(0, 0, this.pageWidth, bannerH, "F");

    // Optional yellow accent bar (left edge)
    if (opts?.accent !== false) {
      this.doc.setFillColor(...COLORS.gargoyleGas);
      this.doc.rect(0, bannerH - 10, 90, 6, "F");
    }

    // Title — wrap to two lines if needed
    this.doc.setFontSize(38);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...COLORS.white);
    const maxW = this.pageWidth - this.margin * 2;
    const lines: string[] = this.doc.splitTextToSize(title, maxW);
    const lineH = 44;
    const totalH = lines.length * lineH;
    let ty = (bannerH - totalH) / 2 + lineH - 10;
    for (const ln of lines) {
      this.doc.text(ln, this.margin, ty);
      ty += lineH;
    }

    this.y = bannerH + 38;
    // Add the top-right page marker for this page
    this.addPageNumber();
  }

  private subHeader(title: string, color: [number, number, number] = COLORS.tigersEye) {
    this.checkPage(24);
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...color);
    this.doc.text(title, this.margin + 8, this.y);
    this.y += 16;
  }

  private divider() {
    this.checkPage(12);
    this.doc.setDrawColor(210, 210, 215);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.y, this.pageWidth - this.margin, this.y);
    this.y += 8;
  }

  private badge(label: string, bgColor: [number, number, number], textColor: [number, number, number], x: number) {
    this.doc.setFontSize(8);
    const textW = this.doc.getTextWidth(label);
    const bw = textW + 12;
    const bh = 14;
    this.doc.setFillColor(...bgColor);
    this.doc.roundedRect(x, this.y - 10, bw, bh, 3, 3, "F");
    this.doc.setTextColor(...textColor);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(label, x + 6, this.y - 1);
    return bw;
  }

  // Draw Measure logo icon from actual image
  private drawMeasureSymbol(x: number, y: number, w: number, h: number) {
    try {
      // Calculate size to fit within the area - use 95% to fill more space like the actual design
      const imgSize = Math.min(w, h) * 0.95;
      const imgX = x + (w - imgSize) / 2;
      const imgY = y + (h - imgSize) / 2;
      this.doc.addImage(MEASURE_ICON_BASE64, "PNG", imgX, imgY, imgSize, imgSize);
    } catch {
      // Fallback: draw a simple "M" if image fails
      this.doc.setFontSize(100);
      this.doc.setFont("helvetica", "bold");
      this.doc.setTextColor(...COLORS.darkCornflower);
      this.doc.text("M", x + w / 2, y + h / 2 + 30, { align: "center" });
    }
  }

  // ── Build the PDF ─────────────────────────────────────

  async build(
    project: ExportProject,
    sessions: ExportSession[],
    artifacts: ExportArtifact[],
    _interrogations: ExportInterrogation[],
    mode: PdfMode = "draft",
    narrative?: string,
    cover?: CoverDetails,
    teamMembers: TeamMember[] = []
  ) {
    this.mode = mode;
    const completedCount = sessions.filter(s => s.status === "completed").length;
    const progressPercent = Math.round((completedCount / 12) * 100);

    // ═══ PAGE 1: COVER ═══
    await this.buildCoverPage(project, completedCount, progressPercent, cover);

    // ═══ PAGE 2: LETTER OF ACKNOWLEDGMENT (full-bleed branded image) ═══
    this.doc.addPage();
    this.pageNum++;
    this.doc.addImage(PDF_STATIC_PAGE_2, "JPEG", 0, 0, this.pageWidth, this.pageHeight);

    // ═══ PAGE 3: ABOUT MEASURE & CARE MODEL (full-bleed branded image) ═══
    this.doc.addPage();
    this.pageNum++;
    this.doc.addImage(PDF_STATIC_PAGE_3, "JPEG", 0, 0, this.pageWidth, this.pageHeight);

    // ═══ POLISHED MODE: fixed 15-page Strategic Plan, one section per page ═══
    if (this.mode === "polished" && narrative && narrative.trim()) {
      this.spCover = cover;
      await this.renderStrategicPlanFixed15(project, sessions, narrative, teamMembers, artifacts);
      return this.doc;
    }


    // ═══ DRAFT MODE (or polished fallback): original behavior ═══
    this.doc.addPage();
    this.pageNum++;
    this.y = this.margin;
    this.buildStrategicOverview(project, sessions, artifacts);

    for (const session of sessions) {
      const sessionArtifacts = artifacts.filter(a => a.session_id === session.id);
      const hasRefined = sessionArtifacts.some(a => a.content?.refined);
      const include = session.status === "completed" || session.notes || session.next_steps || hasRefined;
      if (!include) continue;

      this.doc.addPage();
      this.pageNum++;
      this.y = this.margin;
      this.buildSessionPage(session, artifacts);
    }

    this.doc.addPage();
    this.pageNum++;
    this.y = this.margin;
    this.buildActionPlanSummary(project, sessions, completedCount, progressPercent);

    this.addFooter();
    this.addPageNumber();
    return this.doc;
  }

  // ═══ EXECUTIVE SUMMARY (polished only) ═══
  private buildExecutiveSummary(
    project: ExportProject,
    sessions: ExportSession[],
    artifacts: ExportArtifact[],
    completedCount: number,
    progressPercent: number
  ) {
    this.sectionHeader("Executive Summary");
    this.gap(4);

    this.text(
      `${project.organizations.name} has worked through the CARE Model to build a community-grounded strategic plan addressing priorities surfaced by those closest to the issue. This summary distills the strategy that emerged from ${completedCount} of 12 facilitated working sessions.`,
      10, "normal", COLORS.bodyText
    );
    this.gap(10);

    // Phase highlights
    const phases = [
      { name: "Phase 1 — Community Assessment", range: [1, 5] as [number, number] },
      { name: "Phase 2 — Solution Development", range: [6, 10] as [number, number] },
      { name: "Phase 3 — Implementation & Measurement", range: [11, 12] as [number, number] },
    ];

    for (const phase of phases) {
      const phaseSessions = sessions.filter(
        s => s.session_number >= phase.range[0] && s.session_number <= phase.range[1]
      );
      const refinedItems: { num: number; name: string; text: string }[] = [];
      for (const s of phaseSessions) {
        const a = artifacts.find(a => a.session_id === s.id && a.content?.refined);
        if (a?.content?.refined) {
          refinedItems.push({
            num: s.session_number,
            name: s.session_name,
            text: String(a.content.refined),
          });
        }
      }
      if (!refinedItems.length) continue;

      this.checkPage(40);
      this.subHeader(phase.name, COLORS.darkCornflower);
      for (const item of refinedItems) {
        this.checkPage(30);
        this.text(`Meeting ${item.num} — ${item.name}`, 10, "bold", COLORS.tigersEye);
        this.gap(2);
        // First paragraph (or first 280 chars), markdown-rendered
        const firstPara = item.text.split(/\n{2,}/)[0]?.trim() ?? "";
        const snippet = firstPara.length > 320
          ? firstPara.slice(0, 320).replace(/\s+\S*$/, "") + "…"
          : firstPara;
        this.renderMarkdown(snippet, { size: 9 });
      }
      this.gap(6);
    }

    this.divider();
    this.gap(4);
    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "italic");
    this.doc.setTextColor(...COLORS.midGray);
    this.doc.text(
      `Plan completion: ${progressPercent}% (${completedCount}/12 sessions)`,
      this.margin, this.y
    );
    this.addFooter();
    this.addPageNumber();
  }

  private async buildCoverPage(
    project: ExportProject,
    _completedCount: number,
    _progressPercent: number,
    cover?: CoverDetails
  ) {
    if (this.mode === "polished") {
      await this.buildPolishedCoverPage(project, cover);
      return;
    }

    this.buildDraftCoverPage(project, cover);
  }

  private async buildPolishedCoverPage(
    project: ExportProject,
    cover?: CoverDetails
  ) {
    const W = this.pageWidth;
    const H = this.pageHeight;

    try {
      const dataUrl = await renderPdfCoverPageToDataUrl({
        projectName: project.name,
        date: formatCoverDate(cover),
        orgLogoUrl: cover?.orgLogoDataUrl,
        coverPhotoUrl: cover?.coverPhotoDataUrl,
        preparedBy: cover?.facilitatorName?.trim() || "MEASURE",
      });
      this.doc.addImage(dataUrl, "PNG", 0, 0, W, H, undefined, "FAST");
    } catch (e) {
      console.warn("Polished cover render failed, falling back to draft cover", e);
      this.buildDraftCoverPage(project, cover);
    }
  }

  private buildDraftCoverPage(
    project: ExportProject,
    cover?: CoverDetails
  ) {
    const W = this.pageWidth;
    const H = this.pageHeight;

    try {
      this.doc.addImage(COVER_MOBILIZATION_GUIDE_BASE64, "PNG", 0, 0, W, H, undefined, "FAST");
      return;
    } catch (e) {
      console.warn("Static cover render failed, falling back to generated cover", e);
    }

    // ── 1. Top navy band ──
    const topBandH = H * 0.11;
    this.doc.setFillColor(...COLORS.darkCornflower);
    this.doc.rect(0, 0, W, topBandH, "F");

    // White logo square (centered, protrudes down into photo area)
    const sqSize = Math.min(W * 0.16, 110);
    const sqX = (W - sqSize) / 2;
    const sqY = topBandH - sqSize * 0.45; // protrudes ~55% into the photo
    this.doc.setFillColor(255, 255, 255);
    this.doc.rect(sqX, sqY, sqSize, sqSize, "F");

    // Logo image (or org abbreviation fallback)
    const orgName = (project.organizations?.name || project.name || "Organization").trim();
    if (cover?.orgLogoDataUrl) {
      try {
        const pad = sqSize * 0.12;
        const fmt = cover.orgLogoDataUrl.includes("image/jpeg") ? "JPEG" : "PNG";
        this.doc.addImage(
          cover.orgLogoDataUrl, fmt as any,
          sqX + pad, sqY + pad, sqSize - pad * 2, sqSize - pad * 2,
          undefined, "FAST"
        );
      } catch (e) {
        console.warn("Logo render failed", e);
      }
    } else {
      this.doc.setFont("helvetica", "bold");
      this.doc.setFontSize(28);
      this.doc.setTextColor(...COLORS.darkCornflower);
      const abbr = orgName.slice(0, 3).toUpperCase();
      const tw = this.doc.getTextWidth(abbr);
      this.doc.text(abbr, sqX + (sqSize - tw) / 2, sqY + sqSize / 2 + 10);
    }

    // ── 2. Photo hero area ──
    const photoY = topBandH;
    const bottomBandH = H * 0.05;
    const photoH = H - topBandH - bottomBandH;
    if (cover?.coverPhotoDataUrl) {
      try {
        const fmt = cover.coverPhotoDataUrl.includes("image/png") ? "PNG" : "JPEG";
        this.doc.addImage(
          cover.coverPhotoDataUrl, fmt as any,
          0, photoY, W, photoH,
          undefined, "FAST"
        );
      } catch (e) {
        console.warn("Cover photo render failed, falling back to navy", e);
        this.doc.setFillColor(...COLORS.darkCornflower);
        this.doc.rect(0, photoY, W, photoH, "F");
      }
    } else {
      // Placeholder: solid navy with subtle horizontal stripes
      this.doc.setFillColor(...COLORS.darkCornflower);
      this.doc.rect(0, photoY, W, photoH, "F");
      this.doc.setDrawColor(255, 255, 255);
      this.doc.setLineWidth(0.3);
      for (let yy = photoY + 14; yy < photoY + photoH; yy += 18) {
        this.doc.line(0, yy, W, yy);
      }
      // Placeholder hint
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(9);
      this.doc.setTextColor(255, 255, 255);
      this.doc.text(
        "Add a cover photo from the Cover tab",
        W / 2 - 80, photoY + photoH / 2
      );
    }

    // ── 3. Geometric blocks (bottom-right corner of photo) ──
    const blkBaseY = photoY + photoH; // sits on top of bottom band
    const blkOrangeW = W * 0.10, blkOrangeH = photoH * 0.18;
    const blkGoldW = W * 0.065, blkGoldH = photoH * 0.12;
    const blkBlueW = W * 0.065, blkBlueH = photoH * 0.075;
    let bx = W;
    bx -= blkOrangeW;
    this.doc.setFillColor(...COLORS.tigersEye);
    this.doc.rect(bx, blkBaseY - blkOrangeH, blkOrangeW, blkOrangeH, "F");
    bx -= blkGoldW;
    this.doc.setFillColor(...COLORS.gargoyleGas);
    this.doc.rect(bx, blkBaseY - blkGoldH, blkGoldW, blkGoldH, "F");
    bx -= blkBlueW;
    this.doc.setFillColor(...COLORS.darkCornflower);
    this.doc.rect(bx, blkBaseY - blkBlueH, blkBlueW, blkBlueH, "F");

    // ── 4. White text card (bottom-left, overlays photo) ──
    const cardW = W * 0.52;
    const cardH = photoH * 0.42;
    const cardX = 0;
    const cardY = blkBaseY - cardH;
    this.doc.setFillColor(255, 255, 255);
    this.doc.rect(cardX, cardY, cardW, cardH, "F");

    const padX = 28;
    const titleText = `${orgName} Community Mobilization Guide`.toUpperCase();
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(22);
    this.doc.setTextColor(...COLORS.darkText);
    const wrapped = this.doc.splitTextToSize(titleText, cardW - padX * 2);
    const lineH = 24;
    let ty = cardY + 36;
    wrapped.forEach((line: string) => {
      this.doc.text(line, cardX + padX, ty);
      ty += lineH;
    });

    // PREPARED BY block
    const prepY = cardY + cardH - 56;
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(9);
    this.doc.setTextColor(...COLORS.darkCornflower);
    this.doc.text("PREPARED BY", cardX + padX, prepY);

    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(12);
    this.doc.setTextColor(...COLORS.darkText);
    const preparer = (cover?.facilitatorName?.trim() || "MEASURE").toUpperCase();
    this.doc.text(preparer, cardX + padX, prepY + 18);

    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(9);
    this.doc.setTextColor(...COLORS.darkCornflower);
    this.doc.text("wemeasure.org", cardX + padX, prepY + 34);

    // ── 5. Bottom navy band with date + CARE MODEL ──
    const bbY = H - bottomBandH;
    this.doc.setFillColor(...COLORS.darkCornflower);
    this.doc.rect(0, bbY, W, bottomBandH, "F");

    const dateStr = (cover?.date?.trim() ||
      new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" })
    ).toUpperCase();
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(10);
    this.doc.setTextColor(255, 255, 255);
    this.doc.text(dateStr, 40, bbY + bottomBandH / 2 + 4);
    this.doc.setFont("helvetica", "normal");
    this.doc.text("CARE MODEL", W - 40 - this.doc.getTextWidth("CARE MODEL"), bbY + bottomBandH / 2 + 4);
  }


  // ═══ PAGE 2: Letter of Acknowledgment ═══
  private buildLetterPage() {
    const headerH = 120;
    const splitX = this.pageWidth * 0.72;

    // Left blue section
    this.doc.setFillColor(...COLORS.darkCornflower);
    this.doc.rect(0, 0, splitX, headerH, "F");

    // Right white section
    this.doc.setFillColor(...COLORS.white);
    this.doc.rect(splitX, 0, this.pageWidth - splitX, headerH, "F");

    // Title text
    const titleLeftMargin = 20;
    this.doc.setFontSize(36);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...COLORS.white);
    this.doc.text("Letter of", titleLeftMargin, 45);
    this.doc.text("Acknowledgment", titleLeftMargin, 85);

    // Draw Measure symbol on right side
    this.drawMeasureSymbol(splitX, 0, this.pageWidth - splitX, headerH);

    this.y = headerH + 30;

    this.text("Dear Friend,", 10, "normal", COLORS.darkText);
    this.gap(8);

    this.text(
      "As we work to eliminate social justice disparities, Measure calls for strengthening communities to self-advocate through our CARE Model, while also equipping them to interrogate artificial intelligence and the systems shaping their lives.",
      10, "normal", COLORS.bodyText
    );
    this.gap(8);

    this.text(
      "Community Mobilization (CM) is defined as a process of building the capacity of communities to plan, carry out, and evaluate activities in a participatory and sustained way to improve their health. CM aims to facilitate positive and sustainable changes in social norms and attitudes and in individual, household, and community practices.",
      10, "normal", COLORS.bodyText
    );
    this.gap(8);

    this.text(
      "By centering community voice, and the active interrogation of AI, the CARE Model strengthens the community mobilization process. As technology increasingly informs decisions about our communities, it is critical that those most impacted are not just included, but empowered to question, challenge, and reshape these systems. Without an equitable framework like the CARE Model built into both community mobilization and technological systems, we risk the continual perpetuation of oppression. We might even do harm rather than good in our neighborhoods.",
      10, "normal", COLORS.bodyText
    );
    this.gap(8);

    this.text(
      "This CARE Model Community Mobilization Guide intends to provide direction on how to partner with your community to fully participate in the process of change, both in human systems and AI-driven environments. The strategy includes both the problem (opportunity) and solutions to fix it. A detailed theory of change is formed with a few key metrics to measure outcomes. When you are ready to put this plan into action, the strategy recommends using a transparent system to track and measure progress, ensuring accountability not only in outcomes, but in how decisions are made, including those influenced by AI.",
      10, "normal", COLORS.bodyText
    );
    this.gap(8);

    this.text(
      "Measure hopes this community mobilization guide will encourage your organization to move forward in eliminating social disparities, interrogating systems of power, innovating for justice, and measuring world-changing solutions along the way.",
      10, "normal", COLORS.bodyText
    );
    this.gap(16);

    // Keep the whole signature section aligned as one block
    const cheersY = this.y;
    this.text("Cheers To The Greater Good,", 11, "normal", COLORS.darkText);
    this.gap(22);

    const signatureTopY = this.y;

    // Signature — "Meme Styles" in large cursive script font
    this.doc.setFontSize(15);
    this.doc.setFont("DancingScript", "normal");
    this.doc.setTextColor(...COLORS.darkText);
    this.doc.text("Meme Styles", this.margin, signatureTopY);
    this.y = signatureTopY + 28;

    // Title and website
    const titleY = this.y;
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(...COLORS.darkText);
    this.doc.text("Measure Founder + President", this.margin, titleY);
    this.y = titleY + 14;

    const websiteY = this.y;
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(...COLORS.midGray);
    this.doc.text("www.wemeasure.ai", this.margin, websiteY);

    const photoSize = 108;
    const photoX = this.pageWidth * 0.4;
    const photoY = cheersY - 15;

    // Founder circular photo — smaller and aligned to the signature block
    try {
      this.doc.addImage(FOUNDER_PHOTO_BASE64, "JPEG", photoX, photoY, photoSize, photoSize);
    } catch (e) {
      console.error("Founder photo error:", e);
    }

    // Name caption under photo
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...COLORS.darkText);
    this.doc.text("Meme Styles", photoX + photoSize / 2, photoY + photoSize + 14, { align: "center" });

    // Blue 3D cube graphic (far right edge)
    try {
      const cubeW = 150;
      const cubeH = 180;
      const cubeX = this.pageWidth - cubeW + 35;
      const cubeY = photoY + 25;
      this.doc.addImage(BLUE_CUBE_BASE64, "PNG", cubeX, cubeY, cubeW, cubeH);
    } catch (e) {
      console.error("Cube error:", e);
    }

    this.addFooter();
    this.addPageNumber();
  }

  // ═══ PAGE 3: About Measure & CARE Model ═══
  private buildAboutPage() {
    // Top accent line
    this.doc.setFillColor(...COLORS.darkCornflower);
    this.doc.rect(this.margin, this.y, this.contentWidth, 4, "F");
    this.y += 75;

    // About Measure
    this.doc.setFontSize(36);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...COLORS.darkText);
    this.doc.text("About Measure", this.margin, this.y);
    this.y += 40;

    this.text(
      "Measure is a community-based research and public education organization rooted in data-driven activism for Powerful Groups Targeted for Oppression (PGTOs). We encourage people to use data to eliminate social disparities. We do this by elevating data in a usable format for the community that initiates community mobilization.",
      11, "normal", COLORS.bodyText
    );
    this.gap(14);
    this.text(
      "Community mobilization drives large-scale system changes that leads to the development of equitable policies and practices, which expand opportunity and open paths to upward mobility.",
      11, "normal", COLORS.bodyText
    );

    this.gap(40);

    // CARE Model section with dark background
    const careY = this.y;
    const careH = 290;
    this.doc.setFillColor(...COLORS.darkCornflower);
    this.doc.rect(0, careY, this.pageWidth, careH, "F");

    // CARE heading block aligned to the reference layout
    const careContentX = this.margin + 34;
    const careTextWidth = this.pageWidth - careContentX - this.margin;
    const titleY = careY + 60;
    this.doc.setFillColor(...COLORS.gargoyleGas);
    this.doc.rect(0, titleY - 18, careContentX - 28, 8, "F");

    this.y = titleY;
    this.doc.setFontSize(34);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...COLORS.white);
    this.doc.text("The CARE Model", careContentX, this.y);
    this.y += 42;

    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(220, 225, 255);
    const careDesc = "The C.A.R.E. (Community, Advocacy, Resilience, Evidence) model is a process for working in active partnership with communities to develop solutions to complex social problems. Each letter represents a component of the community mobilization process that organizations and institutions will go through as they partner with communities to address problems. It provides a means for increasing meaningful engagement and minimizing all potential trauma to the community.";
    const careLines = this.doc.splitTextToSize(careDesc, careTextWidth);
    for (const line of careLines) {
      this.doc.text(line, careContentX, this.y);
      this.y += 14;
    }

    this.y += 6;
    this.doc.setFont("helvetica", "normal");
    const deployLine = "The CARE model is deployed when an organization or group comes together to address known disparities.";
    const deployLines = this.doc.splitTextToSize(deployLine, careTextWidth);
    for (const line of deployLines) {
      this.doc.text(line, careContentX, this.y);
      this.y += 14;
    }

    this.y += 8;
    this.doc.setFont("helvetica", "normal");
    this.doc.text("The CARE Model is based on the four guiding principles below:", careContentX, this.y);
    this.y += 18;

    const principles = [
      ["C", "Community is involved from the beginning."],
      ["A", "Advocate with the community to address disparities."],
      ["R", "Generate solutions that strengthen community Resilience."],
      ["E", "Use data and Evidence for data-informed decisions."],
    ];
    for (const [letter, desc] of principles) {
      this.doc.setFont("helvetica", "bold");
      this.doc.setTextColor(...COLORS.white);
      this.doc.text(`${letter} -`, careContentX, this.y);
      this.doc.setFont("helvetica", "bold");
      this.doc.text(desc, careContentX + 22, this.y);
      this.y += 16;
    }

    this.y = careY + careH + 10;
    this.addFooter();
    this.addPageNumber();
  }

  // ═══ STRATEGIC OVERVIEW ═══
  private buildStrategicOverview(
    project: ExportProject,
    sessions: ExportSession[],
    artifacts: ExportArtifact[]
  ) {
    this.bannerHeader("Strategic Overview");

    // Phase summary cards
    const phases = [
      { name: "Phase 1: Community Assessment", range: [1, 5], desc: "Understanding community needs, identifying stakeholders, and mapping existing assets." },
      { name: "Phase 2: Solution Development", range: [6, 10], desc: "Developing evidence-based strategies, building theory of change, and creating implementation plans." },
      { name: "Phase 3: Implementation & Measurement", range: [11, 12], desc: "Executing the strategic plan, tracking outcomes, and ensuring community accountability." },
    ];

    for (const phase of phases) {
      this.checkPage(80);
      const boxY = this.y;
      this.roundedBox(this.margin, boxY, this.contentWidth, 70, COLORS.lightGray);

      // Phase title
      this.doc.setFontSize(12);
      this.doc.setFont("helvetica", "bold");
      this.doc.setTextColor(...COLORS.darkCornflower);
      this.doc.text(phase.name, this.margin + 14, boxY + 20);

      // Phase desc
      this.doc.setFontSize(9);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(...COLORS.bodyText);
      const descLines = this.doc.splitTextToSize(phase.desc, this.contentWidth - 28);
      let ly = boxY + 34;
      for (const l of descLines) {
        this.doc.text(l, this.margin + 14, ly);
        ly += 12;
      }

      // Session count status
      const phaseSessions = sessions.filter(
        s => s.session_number >= phase.range[0] && s.session_number <= phase.range[1]
      );
      const completed = phaseSessions.filter(s => s.status === "completed").length;
      this.doc.setFontSize(8);
      this.doc.setFont("helvetica", "bold");
      this.doc.setTextColor(...COLORS.accent);
      this.doc.text(`${completed}/${phaseSessions.length} Completed`, this.pageWidth - this.margin - 10, boxY + 20, { align: "right" });

      this.y = boxY + 78;
    }

    // Key deliverables summary - only refined outputs
    this.gap(8);
    this.sectionHeader("Key Deliverables");

    let hasDeliverables = false;
    for (const session of sessions) {
      const sessionArtifacts = artifacts.filter(a => a.session_id === session.id);
      for (const artifact of sessionArtifacts) {
        if (artifact.content?.refined) {
          hasDeliverables = true;
          this.checkPage(30);
          this.doc.setFontSize(9);
          this.doc.setFont("helvetica", "bold");
          this.doc.setTextColor(...COLORS.darkCornflower);
          this.doc.text(`Meeting ${session.session_number}: ${session.session_name}`, this.margin + 8, this.y);
          this.y += 14;

          const refined = artifact.content.refined as string;
          if (this.mode === "polished") {
            // Render full markdown content cleanly
            this.renderMarkdown(refined, { size: 9 });
          } else {
            const summary = refined.length > 200 ? refined.substring(0, 200) + "..." : refined;
            this.text(summary, 8.5, "normal", COLORS.bodyText, this.contentWidth - 16);
          }
          this.gap(8);
        }
      }
    }

    if (!hasDeliverables && this.mode !== "polished") {
      this.text("Deliverables will be listed here as sessions are completed.", 9, "italic", COLORS.midGray);
    }

    this.addFooter();
    this.addPageNumber();
  }

  // ═══ SESSION STRATEGY PAGE (filtered - only finalized data) ═══
  private buildSessionPage(
    session: ExportSession,
    allArtifacts: ExportArtifact[]
  ) {
    const sessionContentConfig = getSessionContent(session.session_number);

    // Full-width navy banner (matches reference guide style)
    const bannerH = 130;
    this.doc.setFillColor(...COLORS.darkCornflower);
    this.doc.rect(0, 0, this.pageWidth, bannerH, "F");

    // Yellow accent bar
    this.doc.setFillColor(...COLORS.gargoyleGas);
    this.doc.rect(0, bannerH - 10, 90, 6, "F");

    // Eyebrow: Meeting N • Phase
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(200, 210, 245);
    this.doc.text(
      `MEETING ${session.session_number}  •  ${this.getPhase(session.session_number).toUpperCase()}`,
      this.margin,
      bannerH / 2 - 6
    );

    // Session name as the big title
    this.doc.setFontSize(28);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...COLORS.white);
    const nameLines: string[] = this.doc.splitTextToSize(session.session_name, this.pageWidth - this.margin * 2);
    let nty = bannerH / 2 + 22;
    for (const ln of nameLines) {
      this.doc.text(ln, this.margin, nty);
      nty += 32;
    }

    this.y = bannerH + 30;
    this.addPageNumber();

    // Status badge
    const statusLabel =
      session.status === "completed" ? "Completed" : session.status === "in_progress" ? "In Progress" : "Not Started";
    const statusBg: [number, number, number] =
      session.status === "completed" ? [230, 245, 235] : session.status === "in_progress" ? [255, 243, 224] : COLORS.lightGray;
    const statusFg: [number, number, number] =
      session.status === "completed" ? COLORS.accent : session.status === "in_progress" ? COLORS.tigersEye : COLORS.midGray;

    this.badge(statusLabel, statusBg, statusFg, this.margin);
    if (session.completed_at) {
      this.doc.setFontSize(8);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(...COLORS.midGray);
      this.doc.text(
        `Completed: ${new Date(session.completed_at).toLocaleDateString()}`,
        this.margin + 90,
        this.y - 1
      );
    }
    this.y += 10;

    // Session purpose (brief)
    if (sessionContentConfig) {
      this.subHeader("Purpose", COLORS.darkCornflower);
      this.text(sessionContentConfig.description, 9.5, "normal", COLORS.bodyText);
      this.gap(4);
    }

    this.divider();

    // ── Only show REFINED / FINAL outputs from artifacts ──
    const sessionArtifacts = allArtifacts.filter(a => a.session_id === session.id);
    for (const artifact of sessionArtifacts) {
      const content = artifact.content;
      if (content?.refined) {
        this.subHeader(this.mode === "polished" ? "Strategy" : "Final Strategy Output", COLORS.accent);
        this.renderMarkdown(String(content.refined), { size: 9 });
        this.gap(6);
        this.divider();
      }
    }

    // ── Session-level notes ──
    if (session.notes) {
      this.subHeader(this.mode === "polished" ? "Summary" : "Executive Summary", COLORS.darkCornflower);
      this.renderMarkdown(session.notes, { size: 9 });
      this.gap(6);
    }

    // ── Next steps as action items ──
    if (session.next_steps) {
      this.checkPage(40);
      const boxY = this.y;
      this.doc.setFillColor(245, 248, 255);
      this.doc.roundedRect(this.margin, boxY, this.contentWidth, 20, 4, 4, "F");
      this.doc.setFillColor(...COLORS.darkCornflower);
      this.doc.rect(this.margin, boxY, 4, 20, "F");

      this.doc.setFontSize(10);
      this.doc.setFont("helvetica", "bold");
      this.doc.setTextColor(...COLORS.darkCornflower);
      this.doc.text("Action Items", this.margin + 14, boxY + 14);
      this.y = boxY + 28;

      // Normalize each line into a markdown bullet so renderMarkdown handles wrapping
      const bulletLines = session.next_steps
        .split(/\n/)
        .map(s => s.replace(/^[-•*]\s*/, "").trim())
        .filter(Boolean)
        .map(s => `- ${s}`)
        .join("\n");
      this.renderMarkdown(bulletLines, { size: 9 });
      this.gap(6);
    }

    // No content message — only show in draft mode
    if (
      this.mode !== "polished" &&
      sessionArtifacts.every(a => !a.content?.refined) &&
      !session.notes &&
      !session.next_steps
    ) {
      this.text("Session strategy pending completion.", 9, "italic", COLORS.midGray);
    }

    this.addFooter();
    this.addPageNumber();
  }

  // ═══ ACTION PLAN SUMMARY ═══
  private buildActionPlanSummary(
    project: ExportProject,
    sessions: ExportSession[],
    completedCount: number,
    progressPercent: number
  ) {
    this.bannerHeader("Action Plan Summary");

    // Stats row
    const stats = [
      { label: "Sessions Completed", value: `${completedCount} / 12` },
      { label: "Progress", value: `${progressPercent}%` },
      { label: "Data Contribution", value: project.data_donation_consent ? "Active" : "Inactive" },
    ];

    const boxW = (this.contentWidth - 20) / 3;
    for (let i = 0; i < stats.length; i++) {
      const bx = this.margin + i * (boxW + 10);
      this.roundedBox(bx, this.y, boxW, 50, COLORS.lightGray);
      this.doc.setFontSize(18);
      this.doc.setFont("helvetica", "bold");
      this.doc.setTextColor(...COLORS.darkCornflower);
      this.doc.text(stats[i].value, bx + boxW / 2, this.y + 22, { align: "center" });
      this.doc.setFontSize(8);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(...COLORS.midGray);
      this.doc.text(stats[i].label, bx + boxW / 2, this.y + 38, { align: "center" });
    }
    this.y += 68;

    // Consolidated action items — grouped by phase in polished mode, by meeting in draft
    this.sectionHeader("Consolidated Action Items");

    const sessionsWithSteps = sessions.filter(s => s.next_steps && s.next_steps.trim());

    if (this.mode === "polished") {
      const phases = [
        { name: "Phase 1 — Community Assessment", range: [1, 5] as [number, number] },
        { name: "Phase 2 — Solution Development", range: [6, 10] as [number, number] },
        { name: "Phase 3 — Implementation & Measurement", range: [11, 12] as [number, number] },
      ];
      for (const phase of phases) {
        const phaseSteps: string[] = [];
        for (const s of sessionsWithSteps) {
          if (s.session_number < phase.range[0] || s.session_number > phase.range[1]) continue;
          for (const raw of s.next_steps!.split(/\n/)) {
            const clean = raw.replace(/^[-•*]\s*/, "").trim();
            if (clean) phaseSteps.push(clean);
          }
        }
        if (!phaseSteps.length) continue;
        this.checkPage(30);
        this.subHeader(phase.name, COLORS.darkCornflower);
        const md = phaseSteps.map(s => `- ${s}`).join("\n");
        this.renderMarkdown(md, { size: 9 });
        this.gap(6);
      }
    } else {
      let hasActions = false;
      for (const s of sessionsWithSteps) {
        hasActions = true;
        this.checkPage(30);
        this.doc.setFontSize(10);
        this.doc.setFont("helvetica", "bold");
        this.doc.setTextColor(...COLORS.darkCornflower);
        this.doc.text(`Meeting ${s.session_number}: ${s.session_name}`, this.margin, this.y);
        this.y += 14;
        const md = s.next_steps!
          .split(/\n/)
          .map(st => st.replace(/^[-•*]\s*/, "").trim())
          .filter(Boolean)
          .map(st => `- ${st}`)
          .join("\n");
        this.renderMarkdown(md, { size: 9 });
        this.gap(8);
      }
      if (!hasActions) {
        this.text("Action items will appear here as sessions are completed.", 9, "italic", COLORS.midGray);
      }
    }

    // Closing note
    this.gap(10);
    this.divider();
    this.gap(8);
    if (completedCount === 12) {
      this.text(
        "All 12 sessions have been completed. This strategic plan represents the full community mobilization journey.",
        11, "bold", COLORS.accent
      );
    } else if (this.mode !== "polished") {
      // "Up Next" is an in-app cue — omit from polished plans
      const next = sessions.find(s => s.status === "not_started") || sessions[completedCount];
      if (next) {
        this.text(`Up Next:  Meeting ${next.session_number} — ${next.session_name}`, 11, "bold", COLORS.darkCornflower);
      }
    }

    if (this.mode !== "polished") {
      this.gap(30);
      this.doc.setFontSize(8);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(...COLORS.midGray);
      this.doc.text(
        `Generated on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} at ${new Date().toLocaleTimeString()}`,
        this.margin,
        this.y
      );
    }
    this.addFooter();
    this.addPageNumber();
  }

  private getPhase(num: number) {
    if (num <= 5) return "Phase 1: Assessment";
    if (num <= 10) return "Phase 2: Solution Development";
    return "Phase 3: Implementation";
  }

  getBlobUrl(): string {
    const blob = this.doc.output("blob");
    return URL.createObjectURL(blob);
  }

  getDataUri(): string {
    return this.doc.output("datauristring");
  }

  getBlob(): Blob {
    return this.doc.output("blob");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FIXED 15-PAGE STRATEGIC PLAN RENDERER
  //   Pages 1–3 are produced by build() (cover + 2 static branded images).
  //   This method produces pages 4–15, one section per page:
  //     4: Table of Contents
  //     5: Executive Summary
  //     6: Organization Mission & Vision
  //     7: Community Context & Assessment
  //     8: Stakeholder Analysis
  //     9: Root Cause & Problem Framing
  //    10: Proposed Solutions
  //    11: Implementation Roadmap
  //    12: Action Items & Next Steps (sessions.next_steps)
  //    13: Measurement & Success Indicators
  //    14: Team & Acknowledgments (project_members)
  //    15: Closing / Call to Action / Contact
  //   Every page 4–15 carries the navy banner + wordmark footer with page #.
  // ═══════════════════════════════════════════════════════════════════════════

  private SP_MARGIN = 54;                  // 0.75" at 72dpi
  private SP_BODY_SIZE = 11;
  private SP_LINE_HEIGHT = 11 * 1.5;       // 16.5pt
  private SP_BANNER_H = 96;                // navy banner height
  private SP_BODY_TOP = 96 + 28;           // banner + breathing room
  private SP_FOOTER_Y_OFFSET = 36;         // distance from bottom edge
  private SP_BODY_BOTTOM_LIMIT() {
    return this.pageHeight - this.SP_FOOTER_Y_OFFSET - 18;
  }

  private spStartSectionPage(title: string, pageLabel: number) {
    this.doc.addPage();
    this.pageNum++;

    // Navy banner
    this.doc.setFillColor(...COLORS.darkCornflower);
    this.doc.rect(0, 0, this.pageWidth, this.SP_BANNER_H, "F");
    // Gold accent under banner
    this.doc.setFillColor(...COLORS.gargoyleGas);
    this.doc.rect(0, this.SP_BANNER_H - 6, 90, 6, "F");

    // Title (Outfit bold, wrapped to one or two lines)
    this.doc.setFont("Outfit", "bold");
    this.doc.setTextColor(...COLORS.white);
    let titleSize = 26;
    this.doc.setFontSize(titleSize);
    const maxW = this.pageWidth - this.SP_MARGIN * 2;
    let lines = this.doc.splitTextToSize(title, maxW) as string[];
    while (lines.length > 2 && titleSize > 18) {
      titleSize -= 2;
      this.doc.setFontSize(titleSize);
      lines = this.doc.splitTextToSize(title, maxW);
    }
    const lineH = titleSize * 1.15;
    const totalH = lines.length * lineH;
    let ty = (this.SP_BANNER_H + totalH) / 2 - 4;
    if (lines.length > 1) ty = (this.SP_BANNER_H - totalH) / 2 + lineH;
    for (const ln of lines) {
      this.doc.text(ln, this.SP_MARGIN, ty);
      ty += lineH;
    }

    // Footer wordmark + page label
    this.spDrawFooter(pageLabel);

    this.y = this.SP_BODY_TOP;
  }

  private spDrawFooter(pageLabel: number) {
    const footerY = this.pageHeight - this.SP_FOOTER_Y_OFFSET;
    // Thin navy rule
    this.doc.setDrawColor(...COLORS.darkCornflower);
    this.doc.setLineWidth(1);
    this.doc.line(this.SP_MARGIN, footerY - 14, this.pageWidth - this.SP_MARGIN, footerY - 14);

    // Wordmark left
    this.doc.setFont("Outfit", "bold");
    this.doc.setFontSize(10);
    this.doc.setTextColor(...COLORS.darkCornflower);
    this.doc.text("MEASURE  •  CARE MODEL STRATEGIC PLAN", this.SP_MARGIN, footerY);

    // Page number right
    this.doc.setFont("Outfit", "normal");
    this.doc.setFontSize(10);
    this.doc.setTextColor(...COLORS.midGray);
    this.doc.text(`PAGE ${pageLabel} OF 15`, this.pageWidth - this.SP_MARGIN, footerY, { align: "right" });
  }

  // Render markdown-style body inside a single section page, with strict
  // height-budget enforcement. Reduces font size if needed, then truncates.
  // Never overflows to a second page.
  private spRenderFittedBody(markdown: string) {
    const maxH = this.SP_BODY_BOTTOM_LIMIT() - this.y;
    const bodySizes = [11, 10.5, 10, 9.5, 9];
    let chosen = bodySizes[0];

    let raw = (markdown || "").replace(/\r\n/g, "\n").trim();
    // Strip any leading H2 the renderer might have accidentally received
    raw = raw.replace(/^##\s+[^\n]+\n+/, "");
    // Strip code fences and images
    raw = raw
      .replace(/```[\s\S]*?```/g, "")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .trim();

    type Block =
      | { kind: "h3"; text: string }
      | { kind: "para"; text: string }
      | { kind: "bullet"; text: string };

    const parseBlocks = (src: string): Block[] => {
      const out: Block[] = [];
      const paraChunks = src.split(/\n{2,}/);
      for (const chunk of paraChunks) {
        const lines = chunk.split("\n").map((l) => l.replace(/\s+$/, ""));
        let buffer: string[] = [];
        const flushPara = () => {
          if (buffer.length) {
            out.push({ kind: "para", text: buffer.join(" ").replace(/\*\*/g, "").replace(/__/g, "") });
            buffer = [];
          }
        };
        for (const line of lines) {
          const h3 = line.match(/^###\s+(.+)$/);
          const bullet = line.match(/^\s*([-*•]|\d+\.)\s+(.+)$/);
          if (h3) {
            flushPara();
            out.push({ kind: "h3", text: h3[1].replace(/\*\*/g, "") });
          } else if (bullet) {
            flushPara();
            out.push({ kind: "bullet", text: bullet[2].replace(/\*\*/g, "").replace(/__/g, "") });
          } else if (line.trim()) {
            buffer.push(line.trim());
          } else {
            flushPara();
          }
        }
        flushPara();
      }
      return out;
    };

    const measure = (blocks: Block[], size: number): number => {
      const lh = size * 1.5;
      const innerW = this.pageWidth - this.SP_MARGIN * 2;
      const bulletInnerW = innerW - 18;
      let h = 0;
      this.doc.setFontSize(size);
      for (const b of blocks) {
        if (b.kind === "h3") {
          this.doc.setFont("Outfit", "bold");
          this.doc.setFontSize(size + 1);
          const ls = this.doc.splitTextToSize(b.text, innerW) as string[];
          h += ls.length * (size + 1) * 1.3 + 6;
          this.doc.setFontSize(size);
        } else if (b.kind === "bullet") {
          this.doc.setFont("Outfit", "normal");
          const ls = this.doc.splitTextToSize(b.text, bulletInnerW) as string[];
          h += ls.length * lh + 4;
        } else {
          this.doc.setFont("Outfit", "normal");
          const ls = this.doc.splitTextToSize(b.text, innerW) as string[];
          h += ls.length * lh + 8;
        }
      }
      return h;
    };

    let blocks = parseBlocks(raw);

    if (blocks.length === 0) {
      const fallback = raw.trim() || (markdown || "").trim();
      if (fallback) {
        blocks = [{ kind: "para", text: fallback.replace(/\*\*/g, "").replace(/__/g, "") }];
      }
    }

    // Choose the largest body size that fits; otherwise truncate.
    let fits = false;
    for (const size of bodySizes) {
      if (measure(blocks, size) <= maxH) {
        chosen = size;
        fits = true;
        break;
      }
    }
    if (!fits) {
      chosen = bodySizes[bodySizes.length - 1];
      // Truncate blocks until they fit — never remove the last block entirely
      while (blocks.length > 1 && measure(blocks, chosen) > maxH) {
        const last = blocks[blocks.length - 1];
        if (last.kind === "para" && last.text.length > 40) {
          last.text = last.text.slice(0, Math.max(40, last.text.length - 80)).replace(/\s+\S*$/, "") + "…";
          if (measure(blocks, chosen) <= maxH) break;
        }
        blocks.pop();
      }
      if (blocks.length === 1 && measure(blocks, chosen) > maxH) {
        const only = blocks[0];
        if (only.kind === "para") {
          while (only.text.length > 40 && measure(blocks, chosen) > maxH) {
            only.text = only.text.slice(0, only.text.length - 60).replace(/\s+\S*$/, "") + "…";
          }
        }
      }
    }

    // Render
    const lh = chosen * 1.5;
    const innerW = this.pageWidth - this.SP_MARGIN * 2;
    const bulletInnerW = innerW - 18;
    for (const b of blocks) {
      if (b.kind === "h3") {
        this.doc.setFont("Outfit", "bold");
        this.doc.setFontSize(chosen + 1);
        this.doc.setTextColor(...COLORS.darkCornflower);
        const ls = this.doc.splitTextToSize(b.text, innerW) as string[];
        for (const ln of ls) {
          this.doc.text(ln, this.SP_MARGIN, this.y + (chosen + 1));
          this.y += (chosen + 1) * 1.3;
        }
        this.y += 4;
      } else if (b.kind === "bullet") {
        this.doc.setFont("Outfit", "bold");
        this.doc.setFontSize(chosen);
        this.doc.setTextColor(...COLORS.darkCornflower);
        this.doc.text("•", this.SP_MARGIN + 2, this.y + chosen);
        this.doc.setFont("Outfit", "normal");
        this.doc.setTextColor(...COLORS.bodyText);
        const ls = this.doc.splitTextToSize(b.text, bulletInnerW) as string[];
        let yy = this.y + chosen;
        for (const ln of ls) {
          this.doc.text(ln, this.SP_MARGIN + 16, yy);
          yy += lh;
        }
        this.y = yy + 2;
      } else {
        this.doc.setFont("Outfit", "normal");
        this.doc.setFontSize(chosen);
        this.doc.setTextColor(...COLORS.bodyText);
        const ls = this.doc.splitTextToSize(b.text, innerW) as string[];
        let yy = this.y + chosen;
        for (const ln of ls) {
          this.doc.text(ln, this.SP_MARGIN, yy);
          yy += lh;
        }
        this.y = yy + 6;
      }
    }
  }

  // Compact renderer for Action Items — always shows all 12 CARE sessions;
  // scales font/columns and trims per-session text rather than dropping entries.
  private spRenderActionItems(
    items: { session: number; name: string; text: string }[]
  ) {
    const sorted = [...items].sort((a, b) => a.session - b.session);
    const maxH = this.SP_BODY_BOTTOM_LIMIT() - this.y;
    const innerW = this.pageWidth - this.SP_MARGIN * 2;
    const count = sorted.length;
    const useTwoCol = count > 6; // 7–12 sessions → 6 per column at most
    const colGap = 18;
    const colW = useTwoCol ? (innerW - colGap) / 2 : innerW;
    const leftItems = useTwoCol ? sorted.slice(0, Math.ceil(count / 2)) : sorted;
    const rightItems = useTwoCol ? sorted.slice(Math.ceil(count / 2)) : [];

    const normalizeText = (t: string) =>
      t.replace(/\r\n/g, "\n").replace(/\*\*/g, "").replace(/__/g, "").replace(/\s+/g, " ").trim();

    const bodySizes =
      count <= 5 ? [10, 9.5, 9, 8.5, 8]
      : count <= 8 ? [9.5, 9, 8.5, 8, 7.5]
      : [9.5, 9, 8.5, 8, 7.5]; // 9–12 sessions, 6 per column max

    type FittedItem = { session: number; name: string; header: string; lines: string[] };

    const truncateHeader = (label: string, size: number): string => {
      this.doc.setFontSize(size);
      if (this.doc.getTextWidth(label) <= colW) return label;
      let trimmed = label;
      while (trimmed.length > 12 && this.doc.getTextWidth(trimmed + "…") > colW) {
        trimmed = trimmed.slice(0, -1);
      }
      return trimmed + "…";
    };

    const fitColumn = (
      colItems: typeof sorted,
      size: number,
      maxLinesPerItem: number,
      gap: number
    ): { items: FittedItem[]; height: number } => {
      const lineH = size * 1.2;
      const headerH = size + 3;
      let h = 0;
      const fitted: FittedItem[] = [];

      for (const item of colItems) {
        const label = truncateHeader(`Session ${item.session} — ${item.name}`, size);
        const text = normalizeText(item.text);
        this.doc.setFontSize(size);
        const bodyLines = this.doc.splitTextToSize(text, colW) as string[];
        const capped = bodyLines.slice(0, maxLinesPerItem);
        if (bodyLines.length > maxLinesPerItem && capped.length > 0) {
          const last = capped[capped.length - 1];
          capped[capped.length - 1] =
            last.length > 3 ? last.replace(/\s+\S*$/, "") + "…" : last + "…";
        }

        fitted.push({ session: item.session, name: item.name, header: label, lines: capped });
        h += headerH + capped.length * lineH + gap;
      }
      return { items: fitted, height: h };
    };

    const columnHeight = (size: number, maxLines: number, gap: number) =>
      Math.max(
        fitColumn(leftItems, size, maxLines, gap).height,
        rightItems.length ? fitColumn(rightItems, size, maxLines, gap).height : 0
      );

    let chosenSize = bodySizes[bodySizes.length - 1];
    let chosenMaxLines = 1;
    const gapFor = (n: number) => (n >= 9 ? 4 : n > 6 ? 5 : 7);

    outer: for (const size of bodySizes) {
      const gap = gapFor(count);
      for (let maxLines = 10; maxLines >= 1; maxLines--) {
        if (columnHeight(size, maxLines, gap) <= maxH) {
          chosenSize = size;
          chosenMaxLines = maxLines;
          break outer;
        }
      }
    }

    const gap = gapFor(count);
    const left = fitColumn(leftItems, chosenSize, chosenMaxLines, gap);
    const right = rightItems.length
      ? fitColumn(rightItems, chosenSize, chosenMaxLines, gap)
      : null;

    const lineH = chosenSize * 1.2;
    const headerH = chosenSize + 3;

    const renderColumn = (colItems: FittedItem[], x: number) => {
      let yy = this.y;
      for (const item of colItems) {
        this.doc.setFont("Outfit", "bold");
        this.doc.setFontSize(chosenSize);
        this.doc.setTextColor(...COLORS.darkCornflower);
        this.doc.text(item.header, x, yy + chosenSize);
        yy += headerH;

        this.doc.setFont("Outfit", "normal");
        this.doc.setTextColor(...COLORS.bodyText);
        for (const ln of item.lines) {
          this.doc.text(ln, x, yy + chosenSize);
          yy += lineH;
        }
        yy += gap;
      }
    };

    renderColumn(left.items, this.SP_MARGIN);
    if (right) {
      renderColumn(right.items, this.SP_MARGIN + colW + colGap);
    }
  }

  private normalizeNarrativeTitle(title: string): string {
    return title
      .trim()
      .replace(/^\*+|\*+$/g, "")
      .replace(/[:.]+$/g, "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  private parseNarrativeSections(pre: string): Map<string, string> {
    const found = new Map<string, string>();
    const h2Regex = /^##\s+(.+)$/gm;
    const matches = [...pre.matchAll(h2Regex)];

    if (matches.length === 0) {
      const trimmed = pre.trim();
      if (trimmed) found.set("executive summary", trimmed);
      return found;
    }

    if (matches[0].index! > 0) {
      const preamble = pre.slice(0, matches[0].index!).trim();
      if (preamble) found.set("executive summary", preamble);
    }

    for (let i = 0; i < matches.length; i++) {
      const title = this.normalizeNarrativeTitle(matches[i][1]);
      const start = matches[i].index! + matches[i][0].length;
      const end = i + 1 < matches.length ? matches[i + 1].index! : pre.length;
      const body = pre.slice(start, end).trim();
      if (!found.has(title) || body) {
        found.set(title, body);
      }
    }

    return found;
  }

  private resolveNarrativeKey(
    normalizedTitle: string,
    aliases: Record<string, string[]>
  ): string | null {
    for (const [key, aliasList] of Object.entries(aliases)) {
      if (aliasList.includes(normalizedTitle)) return key;
    }
    for (const [key, aliasList] of Object.entries(aliases)) {
      if (aliasList.some((a) => normalizedTitle.includes(a) || a.includes(normalizedTitle))) {
        return key;
      }
    }
    if (normalizedTitle.includes("executive") && normalizedTitle.includes("summary")) {
      return "executive summary";
    }
    if (normalizedTitle.includes("mission")) return "mission";
    if (normalizedTitle.includes("assessment") || normalizedTitle.includes("community context")) {
      return "assessment";
    }
    if (normalizedTitle.includes("stakeholder")) return "stakeholders";
    if (normalizedTitle.includes("problem") || normalizedTitle.includes("root cause")) {
      return "problem";
    }
    if (normalizedTitle.includes("solution")) return "solutions";
    if (normalizedTitle.includes("implementation")) return "implementation";
    if (normalizedTitle.includes("measurement") || normalizedTitle.includes("metric")) {
      return "measurement";
    }
    return null;
  }

  private parseExecutiveSummaryParagraphs(markdown: string): string[] {
    let raw = (markdown || "").replace(/\r\n/g, "\n").trim();
    raw = raw
      .replace(/^##\s+[^\n]+\n+/, "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .trim();

    if (!raw) return [];

    const paragraphs: string[] = [];
    for (const chunk of raw.split(/\n{2,}/)) {
      const lines = chunk
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      const text = lines
        .map((line) => {
          const h3 = line.match(/^###\s+(.+)$/);
          if (h3) return h3[1];
          const bullet = line.match(/^\s*([-*•]|\d+\.)\s+(.+)$/);
          if (bullet) return bullet[2];
          return line;
        })
        .join(" ")
        .replace(/\*\*/g, "")
        .replace(/__/g, "")
        .trim();
      if (text) paragraphs.push(text);
    }

    return paragraphs.length ? paragraphs : [raw.replace(/\*\*/g, "").replace(/__/g, "")];
  }

  private deriveVisionFallback(...sections: (string | undefined)[]): string {
    const PLACEHOLDER = "This section will be developed in upcoming sessions.";
    for (const section of sections) {
      const text = String(section ?? "").trim();
      if (!text || text === PLACEHOLDER) continue;
      const paragraphs = this.parseExecutiveSummaryParagraphs(text);
      const candidate = paragraphs.find((p) => p.length >= 80) || paragraphs[0];
      if (candidate?.trim()) return candidate.trim();
    }
    return "";
  }

  private parseMissionVisionContent(
    markdown: string,
    statedMissionFromDb: string,
    narrativeFallbacks?: { solutions?: string; problem?: string; assessment?: string }
  ): { statedMission: string; vision: string; strategicAlignment: string } {
    const stripMd = (value: string) =>
      value.replace(/\*\*/g, "").replace(/__/g, "").replace(/\s+/g, " ").trim();

    let raw = (markdown || "").replace(/\r\n/g, "\n").trim();
    raw = raw
      .replace(/^##\s+[^\n]+\n+/, "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .trim();

    const subsection = (aliases: string[]) => {
      const normalizedAliases = aliases.map((a) => a.toLowerCase());
      const lines = raw.split("\n");
      let capturing = false;
      let buffer: string[] = [];

      const flush = () => {
        const text = stripMd(buffer.join(" ").trim());
        buffer = [];
        capturing = false;
        return text;
      };

      for (const line of lines) {
        const h3 = line.match(/^###\s+(.+)$/);
        if (h3) {
          if (capturing) return flush();
          const title = h3[1].trim().replace(/^\*+|\*+$/g, "").toLowerCase();
          if (normalizedAliases.some((alias) => title === alias.toLowerCase() || title.includes(alias.toLowerCase()))) {
            capturing = true;
          }
          continue;
        }
        if (capturing && line.trim()) buffer.push(line.trim());
      }
      if (capturing) return flush();
      return "";
    };

    let vision = subsection([
      "Our Vision",
      "Vision",
      "Organizational Vision",
    ]);
    let strategicAlignment = subsection([
      "Strategic Alignment",
      "Advancing Our Mission",
      "How This Plan Advances Our Mission",
      "Strategic Focus",
    ]);

    let statedMission =
      statedMissionFromDb.trim() ||
      subsection(["Our Mission", "Mission Statement", "Stated Mission"]);

    const paragraphs = this.parseExecutiveSummaryParagraphs(raw);

    if (!vision && !strategicAlignment && paragraphs.length >= 2) {
      vision = paragraphs[0];
      strategicAlignment = paragraphs[1];
    } else if (!vision && !strategicAlignment && paragraphs.length === 1) {
      if (statedMission) {
        strategicAlignment = paragraphs[0];
      } else {
        statedMission = paragraphs[0];
      }
    } else {
      if (!vision && paragraphs[0]) vision = paragraphs[0];
      if (!strategicAlignment && paragraphs[1]) strategicAlignment = paragraphs[1];
    }

    if (!vision && !strategicAlignment && !statedMission && raw) {
      statedMission = stripMd(raw);
    }

    if (!vision?.trim()) {
      vision = this.deriveVisionFallback(
        narrativeFallbacks?.solutions,
        narrativeFallbacks?.problem,
        narrativeFallbacks?.assessment
      );
    }

    return { statedMission, vision, strategicAlignment };
  }

  private async spRenderMissionVisionPage(
    markdown: string,
    pageLabel: number,
    project: ExportProject,
    narrativeFallbacks?: { solutions?: string; problem?: string; assessment?: string }
  ) {
    const PLACEHOLDER = "This section will be developed in upcoming sessions.";
    const statedMissionFromDb = project.organizations?.mission?.trim() || "";
    const { statedMission, vision, strategicAlignment } = this.parseMissionVisionContent(
      markdown,
      statedMissionFromDb,
      narrativeFallbacks
    );

    const dataUrl = await renderPdfMissionVisionPageToDataUrl({
      pageNumber: pageLabel,
      organizationName: project.organizations?.name?.trim(),
      statedMission: statedMission || PLACEHOLDER,
      vision: vision || PLACEHOLDER,
      strategicAlignment: strategicAlignment || PLACEHOLDER,
      orgLogoUrl: this.spCover?.orgLogoDataUrl,
      footerDate: formatCoverDate(this.spCover),
    });

    this.doc.addPage();
    this.pageNum++;
    this.doc.addImage(dataUrl, "PNG", 0, 0, this.pageWidth, this.pageHeight, undefined, "FAST");
  }

  private parseAssessmentContent(markdown: string): {
    communityLandscape: string;
    populationServed: string;
    baselineInsights: string;
    historicalContext: string;
  } {
    const stripMd = (value: string) =>
      value.replace(/\*\*/g, "").replace(/__/g, "").replace(/\s+/g, " ").trim();

    let raw = (markdown || "").replace(/\r\n/g, "\n").trim();
    raw = raw
      .replace(/^##\s+[^\n]+\n+/, "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .trim();

    const subsection = (aliases: string[]) => {
      const normalizedAliases = aliases.map((a) => a.toLowerCase());
      const lines = raw.split("\n");
      let capturing = false;
      let buffer: string[] = [];

      const flush = () => {
        const text = stripMd(buffer.join(" ").trim());
        buffer = [];
        capturing = false;
        return text;
      };

      for (const line of lines) {
        const h3 = line.match(/^###\s+(.+)$/);
        if (h3) {
          if (capturing) return flush();
          const title = h3[1].trim().replace(/^\*+|\*+$/g, "").toLowerCase();
          if (normalizedAliases.some((alias) => title === alias.toLowerCase() || title.includes(alias.toLowerCase()))) {
            capturing = true;
          }
          continue;
        }
        if (capturing && line.trim()) buffer.push(line.trim());
      }
      if (capturing) return flush();
      return "";
    };

    let communityLandscape = subsection([
      "Community Landscape",
      "Community Context",
      "Context",
      "Geographic Context",
    ]);
    let populationServed = subsection([
      "Population Served",
      "Who We Serve",
      "Community Served",
      "Demographics",
      "People Affected",
    ]);
    let baselineInsights = subsection([
      "Baseline Insights",
      "Data Insights",
      "Key Insights",
      "Baseline Data",
      "Data & Insights",
    ]);
    let historicalContext = subsection([
      "Historical Context",
      "Historical Framing",
      "History",
      "Past Conditions",
    ]);

    const paragraphs = this.parseExecutiveSummaryParagraphs(raw);

    if (!communityLandscape && !populationServed && !baselineInsights && !historicalContext) {
      if (paragraphs.length >= 4) {
        [communityLandscape, populationServed, baselineInsights, historicalContext] = paragraphs.slice(0, 4);
      } else if (paragraphs.length === 3) {
        [communityLandscape, populationServed, baselineInsights] = paragraphs;
      } else if (paragraphs.length === 2) {
        communityLandscape = paragraphs[0];
        populationServed = paragraphs[1];
      } else if (paragraphs.length === 1) {
        communityLandscape = paragraphs[0];
      }
    } else {
      if (!communityLandscape && paragraphs[0]) communityLandscape = paragraphs[0];
      if (!populationServed && paragraphs[1]) populationServed = paragraphs[1];
      if (!baselineInsights && paragraphs[2]) baselineInsights = paragraphs[2];
      if (!historicalContext && paragraphs[3]) historicalContext = paragraphs[3];
    }

    if (!communityLandscape && !populationServed && !baselineInsights && !historicalContext && raw) {
      communityLandscape = stripMd(raw);
    }

    return { communityLandscape, populationServed, baselineInsights, historicalContext };
  }

  private getSessionSourceText(session: ExportSession, artifacts: ExportArtifact[]): string {
    const artifact = artifacts.find((a) => a.session_id === session.id);
    const refined = artifact?.content?.refined;
    if (refined && String(refined).trim()) return String(refined).trim();
    if (session.notes?.trim()) return session.notes.trim();
    if (session.next_steps?.trim()) return session.next_steps.trim();
    return "";
  }

  private buildAssessmentFromSessions(
    sessions: ExportSession[],
    artifacts: ExportArtifact[]
  ): {
    communityLandscape: string;
    populationServed: string;
    baselineInsights: string;
    historicalContext: string;
  } {
    const textFor = (sessionNumber: number) => {
      const session = sessions.find((s) => s.session_number === sessionNumber);
      return session ? this.getSessionSourceText(session, artifacts) : "";
    };

    return {
      communityLandscape: textFor(1),
      populationServed: textFor(2),
      baselineInsights: textFor(5) || textFor(2),
      historicalContext: textFor(3),
    };
  }

  private distributeAssessmentFields(
    fields: {
      communityLandscape: string;
      populationServed: string;
      baselineInsights: string;
      historicalContext: string;
    },
    rawMarkdown: string
  ): {
    communityLandscape: string;
    populationServed: string;
    baselineInsights: string;
    historicalContext: string;
  } {
    const keys = [
      "communityLandscape",
      "populationServed",
      "baselineInsights",
      "historicalContext",
    ] as const;
    const result = { ...fields };
    const emptyKeys = keys.filter((key) => !result[key].trim());
    if (emptyKeys.length === 0) return result;

    const filledTexts = keys.map((key) => result[key].trim()).filter(Boolean);
    const pool = filledTexts.join("\n\n") || rawMarkdown.trim();
    if (!pool) return result;

    const paragraphs = this.parseExecutiveSummaryParagraphs(pool);
    const sentences = paragraphs
      .flatMap((p) => p.split(/(?<=[.!?])\s+/))
      .map((s) => s.trim())
      .filter((s) => s.length > 25);

    if (sentences.length >= emptyKeys.length) {
      let sentenceIndex = 0;
      for (const key of emptyKeys) {
        const chunk: string[] = [];
        const take = Math.max(1, Math.ceil((sentences.length - sentenceIndex) / emptyKeys.length));
        for (let i = 0; i < take && sentenceIndex < sentences.length; i++) {
          chunk.push(sentences[sentenceIndex++]);
        }
        result[key] = chunk.join(" ");
      }
      return result;
    }

    if (paragraphs.length >= emptyKeys.length) {
      emptyKeys.forEach((key, index) => {
        result[key] = paragraphs[index] || paragraphs[paragraphs.length - 1];
      });
      return result;
    }

    const chunkSize = Math.max(1, Math.ceil(pool.length / emptyKeys.length));
    emptyKeys.forEach((key, index) => {
      result[key] = pool.slice(index * chunkSize, (index + 1) * chunkSize).trim();
    });
    return result;
  }

  private deriveAssessmentContent(
    markdown: string,
    sessions: ExportSession[],
    artifacts: ExportArtifact[]
  ): {
    communityLandscape: string;
    populationServed: string;
    baselineInsights: string;
    historicalContext: string;
  } {
    const PLACEHOLDER = "This section will be developed in upcoming sessions.";
    const isPlaceholder = !markdown.trim() || markdown.trim() === PLACEHOLDER;

    let parsed = isPlaceholder
      ? {
          communityLandscape: "",
          populationServed: "",
          baselineInsights: "",
          historicalContext: "",
        }
      : this.parseAssessmentContent(markdown);

    const sessionFallback = this.buildAssessmentFromSessions(sessions, artifacts);
    const merged = {
      communityLandscape: parsed.communityLandscape || sessionFallback.communityLandscape,
      populationServed: parsed.populationServed || sessionFallback.populationServed,
      baselineInsights: parsed.baselineInsights || sessionFallback.baselineInsights,
      historicalContext: parsed.historicalContext || sessionFallback.historicalContext,
    };

    return this.distributeAssessmentFields(merged, isPlaceholder ? "" : markdown);
  }

  private cleanAssessmentDisplayText(text: string): string {
    return text
      .replace(/\*\*/g, "")
      .replace(/__/g, "")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  private deriveAssessmentInsightHighlight(
    fields: {
      communityLandscape: string;
      populationServed: string;
      baselineInsights: string;
      historicalContext: string;
    }
  ): string {
    const PLACEHOLDER = "This section will be developed in upcoming sessions.";
    const pool = [
      fields.communityLandscape,
      fields.populationServed,
      fields.baselineInsights,
    ]
      .map((value) => this.cleanAssessmentDisplayText(value))
      .filter((value) => value && value !== PLACEHOLDER);

    if (!pool.length) return "";

    const combined = pool.join(" ");
    const sentenceMatch = combined.match(/[^.!?]+[.!?]+/);
    const highlight = (sentenceMatch?.[0] || combined).trim();
    return this.fitAssessmentCardText(highlight, 240);
  }

  private fitAssessmentCardText(text: string, maxChars = 480): string {
    const cleaned = this.cleanAssessmentDisplayText(text);
    if (cleaned.length <= maxChars) return cleaned;
    const slice = cleaned.slice(0, maxChars);
    const lastSpace = slice.lastIndexOf(" ");
    const cut = lastSpace > maxChars * 0.6 ? slice.slice(0, lastSpace) : slice;
    return `${cut.trim()}…`;
  }

  private async spRenderCommunityAssessmentPage(
    markdown: string,
    pageLabel: number,
    sessions: ExportSession[],
    artifacts: ExportArtifact[]
  ) {
    const PLACEHOLDER = "This section will be developed in upcoming sessions.";
    const fields = this.deriveAssessmentContent(markdown, sessions, artifacts);
    const { communityLandscape, populationServed, baselineInsights, historicalContext } = fields;

    const fit = (value: string) =>
      this.fitAssessmentCardText(value.trim() || PLACEHOLDER);

    const insightHighlight = this.deriveAssessmentInsightHighlight(fields);

    const dataUrl = await renderPdfCommunityAssessmentPageToDataUrl({
      pageNumber: pageLabel,
      footerDate: formatCoverDate(this.spCover),
      insightHighlight,
      cards: [
        {
          label: "Community Landscape",
          text: fit(communityLandscape),
          icon: "community",
        },
        {
          label: "Population Served",
          text: fit(populationServed),
          icon: "population",
        },
        {
          label: "Baseline Insights",
          text: fit(baselineInsights),
          icon: "insights",
        },
        {
          label: "Historical Context",
          text: fit(historicalContext),
          icon: "history",
        },
      ],
    });

    this.doc.addPage();
    this.pageNum++;
    this.doc.addImage(dataUrl, "PNG", 0, 0, this.pageWidth, this.pageHeight, undefined, "FAST");
  }

  private parseProblemFramingContent(markdown: string): {
    problemStatement: string;
    rootCauses: string;
    systemicDrivers: string;
    whyNow: string;
  } {
    const stripMd = (value: string) =>
      value.replace(/\*\*/g, "").replace(/__/g, "").replace(/\s+/g, " ").trim();

    let raw = (markdown || "").replace(/\r\n/g, "\n").trim();
    raw = raw
      .replace(/^##\s+[^\n]+\n+/, "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .trim();

    const subsection = (aliases: string[]) => {
      const normalizedAliases = aliases.map((a) => a.toLowerCase());
      const lines = raw.split("\n");
      let capturing = false;
      let buffer: string[] = [];

      const flush = () => {
        const text = stripMd(buffer.join(" ").trim());
        buffer = [];
        capturing = false;
        return text;
      };

      for (const line of lines) {
        const h3 = line.match(/^###\s+(.+)$/);
        if (h3) {
          if (capturing) return flush();
          const title = h3[1].trim().replace(/^\*+|\*+$/g, "").toLowerCase();
          if (normalizedAliases.some((alias) => title === alias || title.includes(alias))) {
            capturing = true;
          }
          continue;
        }
        if (capturing && line.trim()) buffer.push(line.trim());
      }
      if (capturing) return flush();
      return "";
    };

    let problemStatement = subsection([
      "Problem Statement",
      "The Problem",
      "Core Problem",
      "Problem Framing",
    ]);
    let rootCauses = subsection([
      "Root Causes",
      "Root Cause",
      "Underlying Causes",
      "Causal Factors",
    ]);
    let systemicDrivers = subsection([
      "Systemic Drivers",
      "Systemic Factors",
      "Systemic Framing",
      "Structural Factors",
    ]);
    let whyNow = subsection([
      "Why Now",
      "Urgency",
      "Timing",
      "Why This Matters Now",
    ]);

    const paragraphs = this.parseExecutiveSummaryParagraphs(raw);

    if (!problemStatement && !rootCauses && !systemicDrivers && !whyNow) {
      if (paragraphs.length >= 4) {
        [problemStatement, rootCauses, systemicDrivers, whyNow] = paragraphs.slice(0, 4);
      } else if (paragraphs.length === 3) {
        [problemStatement, rootCauses, systemicDrivers] = paragraphs;
      } else if (paragraphs.length === 2) {
        problemStatement = paragraphs[0];
        rootCauses = paragraphs[1];
      } else if (paragraphs.length === 1) {
        problemStatement = paragraphs[0];
      }
    } else {
      if (!problemStatement && paragraphs[0]) problemStatement = paragraphs[0];
      if (!rootCauses && paragraphs[1]) rootCauses = paragraphs[1];
      if (!systemicDrivers && paragraphs[2]) systemicDrivers = paragraphs[2];
      if (!whyNow && paragraphs[3]) whyNow = paragraphs[3];
    }

    if (!problemStatement && !rootCauses && !systemicDrivers && !whyNow && raw) {
      problemStatement = stripMd(raw);
    }

    return { problemStatement, rootCauses, systemicDrivers, whyNow };
  }

  private buildProblemFramingFromSessions(
    sessions: ExportSession[],
    artifacts: ExportArtifact[]
  ): {
    problemStatement: string;
    rootCauses: string;
    systemicDrivers: string;
    whyNow: string;
  } {
    const textFor = (sessionNumber: number) => {
      const session = sessions.find((s) => s.session_number === sessionNumber);
      return session ? this.getSessionSourceText(session, artifacts) : "";
    };

    return {
      problemStatement: textFor(1),
      rootCauses: textFor(1),
      systemicDrivers: textFor(3),
      whyNow: textFor(3) || textFor(1),
    };
  }

  private deriveProblemFramingContent(
    markdown: string,
    sessions: ExportSession[],
    artifacts: ExportArtifact[]
  ): {
    problemStatement: string;
    rootCauses: string;
    systemicDrivers: string;
    whyNow: string;
  } {
    const PLACEHOLDER = "This section will be developed in upcoming sessions.";
    const isPlaceholder = !markdown.trim() || markdown.trim() === PLACEHOLDER;

    let parsed = isPlaceholder
      ? { problemStatement: "", rootCauses: "", systemicDrivers: "", whyNow: "" }
      : this.parseProblemFramingContent(markdown);

    const sessionFallback = this.buildProblemFramingFromSessions(sessions, artifacts);

    const merged = {
      problemStatement: parsed.problemStatement || sessionFallback.problemStatement,
      rootCauses: parsed.rootCauses || sessionFallback.rootCauses,
      systemicDrivers: parsed.systemicDrivers || sessionFallback.systemicDrivers,
      whyNow: parsed.whyNow || sessionFallback.whyNow,
    };

    if (merged.problemStatement && merged.rootCauses === merged.problemStatement) {
      const paragraphs = this.parseExecutiveSummaryParagraphs(merged.problemStatement);
      if (paragraphs.length >= 2) {
        merged.problemStatement = paragraphs[0];
        merged.rootCauses = paragraphs[1];
      }
    }

    if (merged.systemicDrivers && merged.whyNow === merged.systemicDrivers) {
      const paragraphs = this.parseExecutiveSummaryParagraphs(merged.systemicDrivers);
      if (paragraphs.length >= 2) {
        merged.systemicDrivers = paragraphs[0];
        merged.whyNow = paragraphs[1];
      }
    }

    return {
      problemStatement: merged.problemStatement || PLACEHOLDER,
      rootCauses: merged.rootCauses || merged.problemStatement || PLACEHOLDER,
      systemicDrivers: merged.systemicDrivers || PLACEHOLDER,
      whyNow: merged.whyNow || PLACEHOLDER,
    };
  }

  private async spRenderProblemFramingPage(
    markdown: string,
    pageLabel: number,
    sessions: ExportSession[],
    artifacts: ExportArtifact[]
  ) {
    const PLACEHOLDER = "This section will be developed in upcoming sessions.";
    const fields = this.deriveProblemFramingContent(markdown, sessions, artifacts);
    const fit = (value: string, max = 520) =>
      this.fitAssessmentCardText(value.trim() || PLACEHOLDER, max);

    const dataUrl = await renderPdfProblemFramingPageToDataUrl({
      pageNumber: pageLabel,
      footerDate: formatCoverDate(this.spCover),
      problemStatement: fit(fields.problemStatement, 380),
      rootCauses: fit(fields.rootCauses, 420),
      systemicDrivers: fit(fields.systemicDrivers, 420),
      whyNow: fit(fields.whyNow, 320),
    });

    this.doc.addPage();
    this.pageNum++;
    this.doc.addImage(dataUrl, "PNG", 0, 0, this.pageWidth, this.pageHeight, undefined, "FAST");
  }

  private async spRenderStyledNarrativePage(
    markdown: string,
    pageLabel: number,
    pageTitle: string,
    project: ExportProject,
    teamMembers: TeamMember[],
    options?: { showSignature?: boolean }
  ) {
    const showSignature = options?.showSignature ?? true;
    const leaders = teamMembers.filter((m) => m.role === "care_team_leader");
    const signatureName = showSignature
      ? this.spCover?.facilitatorName?.trim() ||
        leaders[0]?.full_name?.trim() ||
        leaders[0]?.email ||
        undefined
      : undefined;
    const signatureTitle = showSignature
      ? project.organizations?.name?.trim() || undefined
      : undefined;

    const dataUrl = await renderPdfExecutiveSummaryPageToDataUrl({
      pageTitle,
      pageNumber: pageLabel,
      paragraphs: this.parseExecutiveSummaryParagraphs(markdown),
      showSignature,
      signatureName,
      signatureTitle,
      profilePhotoUrl: showSignature ? this.spCover?.coverPhotoDataUrl : undefined,
      footerDate: formatCoverDate(this.spCover),
    });

    this.doc.addPage();
    this.pageNum++;
    this.doc.addImage(dataUrl, "PNG", 0, 0, this.pageWidth, this.pageHeight, undefined, "FAST");
  }

  private async spRenderExecutiveSummaryPage(
    markdown: string,
    pageLabel: number,
    project: ExportProject,
    teamMembers: TeamMember[]
  ) {
    await this.spRenderStyledNarrativePage(
      markdown,
      pageLabel,
      "Executive Summary",
      project,
      teamMembers
    );
  }

  private parseStakeholderAnalysisContent(markdown: string): {
    paragraphs: string[];
    tableRows: { col1: string; col2: string; col3: string }[];
  } {
    let raw = (markdown || "").replace(/\r\n/g, "\n").trim();
    raw = raw
      .replace(/^##\s+[^\n]+\n+/, "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .trim();

    const stripMd = (value: string) => value.replace(/\*\*/g, "").replace(/__/g, "").trim();
    const paragraphs: string[] = [];
    const tableRows: { col1: string; col2: string; col3: string }[] = [];

    const subsection = (aliases: string[], joinWith: " " | "\n" = " ") => {
      const normalizedAliases = aliases.map((a) => a.toLowerCase());
      const lines = raw.split("\n");
      let capturing = false;
      let buffer: string[] = [];

      const flush = () => {
        const text = buffer.map((line) => stripMd(line)).join(joinWith).trim();
        buffer = [];
        capturing = false;
        return text;
      };

      for (const line of lines) {
        const h3 = line.match(/^###\s+(.+)$/);
        if (h3) {
          if (capturing) return flush();
          const title = h3[1].trim().replace(/^\*+|\*+$/g, "").toLowerCase();
          if (normalizedAliases.some((alias) => title === alias || title.includes(alias))) {
            capturing = true;
          }
          continue;
        }
        if (capturing && line.trim()) buffer.push(line.trim());
      }
      if (capturing) return flush();
      return "";
    };

    const engagementStrategy = subsection([
      "engagement strategy",
      "engagement approach",
      "stakeholder engagement",
      "engagement and strategy",
    ]);
    const keyStakeholdersSection = subsection(
      ["key stakeholders", "stakeholders", "community stakeholders", "invested parties"],
      "\n"
    );

    const parseBulletRow = (line: string) => {
      const text = stripMd(line.replace(/^\s*([-*•]|\d+\.)\s+/, ""));
      const parts = text.split(/\s*[—–-]\s+/).map((part) => part.trim()).filter(Boolean);
      if (parts.length >= 3) {
        return { col1: parts[0], col2: parts[1], col3: parts.slice(2).join(" — ") };
      }
      if (parts.length === 2) {
        return { col1: parts[0], col2: "", col3: parts[1] };
      }
      return { col1: text, col2: "", col3: "" };
    };

    const parseSectionBullets = (sectionText: string) => {
      for (const line of sectionText.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const bullet = trimmed.match(/^\s*([-*•]|\d+\.)\s+(.+)$/);
        if (bullet) tableRows.push(parseBulletRow(trimmed));
      }
    };

    if (engagementStrategy) paragraphs.push(engagementStrategy);
    if (keyStakeholdersSection) parseSectionBullets(keyStakeholdersSection);

    let paraBuffer: string[] = [];
    const flushPara = () => {
      if (!paraBuffer.length) return;
      paragraphs.push(stripMd(paraBuffer.join(" ")));
      paraBuffer = [];
    };

    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) {
        flushPara();
        continue;
      }
      if (trimmed.startsWith("|") || /^[-:| ]+$/.test(trimmed)) continue;
      if (trimmed.startsWith("###")) {
        flushPara();
        if (!keyStakeholdersSection) {
          const title = stripMd(trimmed.replace(/^###\s+/, ""));
          if (!/engagement/i.test(title)) {
            tableRows.push({ col1: title, col2: "", col3: "" });
          }
        }
        continue;
      }
      const bullet = trimmed.match(/^\s*([-*•]|\d+\.)\s+(.+)$/);
      if (bullet) {
        flushPara();
        if (!keyStakeholdersSection) tableRows.push(parseBulletRow(trimmed));
        continue;
      }
      paraBuffer.push(trimmed);
    }
    flushPara();

    if (!paragraphs.length && !tableRows.length && raw) {
      paragraphs.push(stripMd(raw));
    }

    return { paragraphs, tableRows };
  }

  private detectStakeholderAlignment(
    text: string
  ): "ally" | "neutral" | "mixed" | "opposition" | undefined {
    const value = text.toLowerCase();
    if (/oppos|resist|against|adversar|blocker/.test(value)) return "opposition";
    if (/\bmixed\b|persuad|uncertain/.test(value)) return "mixed";
    if (/\bneutral\b|low interest/.test(value)) return "neutral";
    if (/ally|allies|support|partner|champion|coalition/.test(value)) return "ally";
    return undefined;
  }

  private parseStakeholderCardsFromRows(
    tableRows: { col1: string; col2: string; col3: string }[]
  ): {
    name: string;
    role: string;
    engagement: string;
    alignment?: "ally" | "neutral" | "mixed" | "opposition";
  }[] {
    return tableRows
      .filter((row) => row.col1.trim())
      .map((row) => {
        const role = row.col2.trim();
        const engagement = row.col3.trim() || role;
        const roleOnly = role && role !== engagement ? role : "";
        return {
          name: this.cleanAssessmentDisplayText(row.col1),
          role: this.cleanAssessmentDisplayText(roleOnly),
          engagement: this.cleanAssessmentDisplayText(engagement),
          alignment: this.detectStakeholderAlignment(`${role} ${engagement}`),
        };
      });
  }

  private parseStakeholderCardsFromText(text: string): {
    name: string;
    role: string;
    engagement: string;
    alignment?: "ally" | "neutral" | "mixed" | "opposition";
  }[] {
    const cards: {
      name: string;
      role: string;
      engagement: string;
      alignment?: "ally" | "neutral" | "mixed" | "opposition";
    }[] = [];

    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const bullet = trimmed.match(/^\s*([-*•]|\d+\.)\s+(.+)$/);
      const content = bullet ? bullet[2] : trimmed;
      const parts = this.cleanAssessmentDisplayText(content)
        .split(/\s*[—–-]\s+/)
        .map((part) => part.trim())
        .filter(Boolean);
      if (!parts.length) continue;
      const name = parts[0];
      const engagement = parts.length > 1 ? parts.slice(1).join(" — ") : "";
      cards.push({
        name,
        role: parts.length > 2 ? parts[1] : "",
        engagement: parts.length > 2 ? parts.slice(2).join(" — ") : engagement,
        alignment: this.detectStakeholderAlignment(engagement || name),
      });
    }

    return cards;
  }

  private buildStakeholdersFromSession(
    sessions: ExportSession[],
    artifacts: ExportArtifact[]
  ): {
    name: string;
    role: string;
    engagement: string;
    alignment?: "ally" | "neutral" | "mixed" | "opposition";
  }[] {
    const session = sessions.find((s) => s.session_number === 4);
    if (!session) return [];
    const source = this.getSessionSourceText(session, artifacts);
    if (!source.trim()) return [];
    return this.parseStakeholderCardsFromText(source).slice(0, 6);
  }

  private deriveStakeholderContent(
    markdown: string,
    sessions: ExportSession[],
    artifacts: ExportArtifact[]
  ): {
    engagementIntro: string;
    stakeholders: {
      name: string;
      role: string;
      engagement: string;
      alignment?: "ally" | "neutral" | "mixed" | "opposition";
    }[];
  } {
    const PLACEHOLDER = "This section will be developed in upcoming sessions.";
    const isPlaceholder = !markdown.trim() || markdown.trim() === PLACEHOLDER;
    const parsed = isPlaceholder
      ? { paragraphs: [] as string[], tableRows: [] as { col1: string; col2: string; col3: string }[] }
      : this.parseStakeholderAnalysisContent(markdown);

    let engagementIntro = parsed.paragraphs.join(" ").trim();
    let stakeholders = this.parseStakeholderCardsFromRows(parsed.tableRows);

    if (!stakeholders.length) {
      stakeholders = this.buildStakeholdersFromSession(sessions, artifacts);
    }

    if (!engagementIntro && stakeholders.length) {
      engagementIntro = `This plan maps ${stakeholders.length} key stakeholders and how the CARE Team will engage each group to build alignment and shared ownership.`;
    }

    if (!engagementIntro) {
      engagementIntro = isPlaceholder ? PLACEHOLDER : this.cleanAssessmentDisplayText(markdown);
    }

    if (!stakeholders.length && !isPlaceholder) {
      stakeholders = this.parseStakeholderCardsFromText(markdown).slice(0, 6);
    }

    return {
      engagementIntro: this.fitAssessmentCardText(engagementIntro, 320),
      stakeholders: stakeholders.slice(0, 6).map((item) => ({
        ...item,
        name: this.fitAssessmentCardText(item.name, 80),
        role: this.fitAssessmentCardText(item.role, 100),
        engagement: this.fitAssessmentCardText(item.engagement, 220),
      })),
    };
  }

  private deriveStakeholderHighlight(
    engagementIntro: string,
    stakeholders: { engagement: string; alignment?: string }[]
  ): string {
    const PLACEHOLDER = "This section will be developed in upcoming sessions.";
    const intro = this.cleanAssessmentDisplayText(engagementIntro);
    if (intro && intro !== PLACEHOLDER) {
      const sentence = intro.match(/[^.!?]+[.!?]+/)?.[0] || intro;
      return this.fitAssessmentCardText(sentence, 240);
    }
    const ally = stakeholders.find((item) => item.alignment === "ally");
    if (ally?.engagement) return this.fitAssessmentCardText(ally.engagement, 240);
    if (stakeholders[0]?.engagement) return this.fitAssessmentCardText(stakeholders[0].engagement, 240);
    return "";
  }

  private normalizeSolutionRating(value: string): "High" | "Medium" | "Low" {
    const normalized = value.toLowerCase().trim();
    if (/^low\b/.test(normalized)) return "Low";
    if (/^med/.test(normalized)) return "Medium";
    return "High";
  }

  private defaultSolutionRatings(index: number): {
    desirability: "High" | "Medium" | "Low";
    equitably: "High" | "Medium" | "Low";
    feasibility: "High" | "Medium" | "Low";
    sustainability: "High" | "Medium" | "Low";
  } {
    const presets: Array<{
      desirability: "High" | "Medium" | "Low";
      equitably: "High" | "Medium" | "Low";
      feasibility: "High" | "Medium" | "Low";
      sustainability: "High" | "Medium" | "Low";
    }> = [
      { desirability: "High", equitably: "High", feasibility: "Medium", sustainability: "High" },
      { desirability: "High", equitably: "High", feasibility: "High", sustainability: "High" },
      { desirability: "High", equitably: "High", feasibility: "Medium", sustainability: "Medium" },
      { desirability: "Medium", equitably: "High", feasibility: "High", sustainability: "Medium" },
    ];
    return presets[index] ?? presets[presets.length - 1];
  }

  private extractSolutionRatings(text: string): {
    desirability?: "High" | "Medium" | "Low";
    equitably?: "High" | "Medium" | "Low";
    feasibility?: "High" | "Medium" | "Low";
    sustainability?: "High" | "Medium" | "Low";
  } {
    const pick = (...labels: string[]) => {
      for (const label of labels) {
        const match = text.match(new RegExp(`${label}\\s*[:=]?\\s*(high|medium|low)`, "i"));
        if (match) return this.normalizeSolutionRating(match[1]);
      }
      return undefined;
    };
    return {
      desirability: pick("desirability"),
      equitably: pick("equitably", "equity"),
      feasibility: pick("feasibility"),
      sustainability: pick("sustainability"),
    };
  }

  private splitSolutionActionAndDescription(content: string): { action: string; description: string } {
    const cleaned = this.cleanAssessmentDisplayText(content);
    const bold = content.match(/\*\*([^*]+)\*\*/);
    if (bold) {
      const action = bold[1].trim().split(/\s+/)[0].toUpperCase();
      const description = cleaned
        .replace(bold[0], "")
        .replace(/^[—–:-]\s*/, "")
        .trim();
      return { action, description };
    }

    const firstWord = cleaned.split(/\s+/)[0] || "Solution";
    const action = firstWord.replace(/[^a-zA-Z]/g, "").toUpperCase() || "SOLUTION";
    const description = cleaned.slice(firstWord.length).trim().replace(/^[—–:-]\s*/, "");
    return { action, description: description || cleaned };
  }

  private parseSolutionAlignmentRowsFromTable(raw: string): {
    action: string;
    description: string;
    desirability: "High" | "Medium" | "Low";
    equitably: "High" | "Medium" | "Low";
    feasibility: "High" | "Medium" | "Low";
    sustainability: "High" | "Medium" | "Low";
    rank: number;
  }[] {
    const rows: {
      action: string;
      description: string;
      desirability: "High" | "Medium" | "Low";
      equitably: "High" | "Medium" | "Low";
      feasibility: "High" | "Medium" | "Low";
      sustainability: "High" | "Medium" | "Low";
      rank: number;
    }[] = [];

    const lines = raw.split("\n").filter((line) => line.trim().startsWith("|"));
    if (lines.length < 2) return rows;

    const splitRow = (line: string) =>
      line
        .split("|")
        .map((cell) => cell.trim())
        .filter((cell, index, arr) => !(index === 0 && cell === "") && !(index === arr.length - 1 && cell === ""));

    const header = splitRow(lines[0]).map((cell) => cell.toLowerCase());
    const dataLines = lines.slice(1).filter((line) => !/^[-:| ]+$/.test(line.trim()));

    const idx = (aliases: string[]) =>
      header.findIndex((cell) => aliases.some((alias) => cell.includes(alias)));

    const solutionIdx = idx(["solution"]);
    const desirabilityIdx = idx(["desirability"]);
    const equitablyIdx = idx(["equitably", "equity"]);
    const feasibilityIdx = idx(["feasibility"]);
    const sustainabilityIdx = idx(["sustainability"]);
    const rankIdx = idx(["rank"]);

    dataLines.forEach((line, index) => {
      const cells = splitRow(line);
      if (!cells.length) return;
      const solutionCell = cells[solutionIdx >= 0 ? solutionIdx : 0] || "";
      const { action, description } = this.splitSolutionActionAndDescription(solutionCell);
      const defaults = this.defaultSolutionRatings(index);
      const inline = this.extractSolutionRatings(solutionCell);
      rows.push({
        action,
        description,
        desirability:
          (desirabilityIdx >= 0 ? this.normalizeSolutionRating(cells[desirabilityIdx] || "") : inline.desirability) ||
          defaults.desirability,
        equitably:
          (equitablyIdx >= 0 ? this.normalizeSolutionRating(cells[equitablyIdx] || "") : inline.equitably) ||
          defaults.equitably,
        feasibility:
          (feasibilityIdx >= 0 ? this.normalizeSolutionRating(cells[feasibilityIdx] || "") : inline.feasibility) ||
          defaults.feasibility,
        sustainability:
          (sustainabilityIdx >= 0
            ? this.normalizeSolutionRating(cells[sustainabilityIdx] || "")
            : inline.sustainability) || defaults.sustainability,
        rank: rankIdx >= 0 ? Number(cells[rankIdx]) || index + 1 : index + 1,
      });
    });

    return rows;
  }

  private parseSolutionAlignmentRowsFromText(text: string): {
    action: string;
    description: string;
    desirability: "High" | "Medium" | "Low";
    equitably: "High" | "Medium" | "Low";
    feasibility: "High" | "Medium" | "Low";
    sustainability: "High" | "Medium" | "Low";
    rank: number;
  }[] {
    const rows: {
      action: string;
      description: string;
      desirability: "High" | "Medium" | "Low";
      equitably: "High" | "Medium" | "Low";
      feasibility: "High" | "Medium" | "Low";
      sustainability: "High" | "Medium" | "Low";
      rank: number;
    }[] = [];

    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const bullet = trimmed.match(/^\s*([-*•]|\d+\.)\s+(.+)$/);
      const content = bullet ? bullet[2] : trimmed;
      if (!content || /^#{1,3}\s/.test(content)) continue;

      const { action, description } = this.splitSolutionActionAndDescription(content);
      const ratings = this.extractSolutionRatings(content);
      const defaults = this.defaultSolutionRatings(rows.length);
      rows.push({
        action,
        description: description.replace(/\([^)]*desirability[^)]*\)/gi, "").trim(),
        desirability: ratings.desirability || defaults.desirability,
        equitably: ratings.equitably || defaults.equitably,
        feasibility: ratings.feasibility || defaults.feasibility,
        sustainability: ratings.sustainability || defaults.sustainability,
        rank: rows.length + 1,
      });
    }

    return rows;
  }

  private parseSolutionsAlignmentContent(markdown: string): {
    approachIntro: string;
    solutions: {
      action: string;
      description: string;
      desirability: "High" | "Medium" | "Low";
      equitably: "High" | "Medium" | "Low";
      feasibility: "High" | "Medium" | "Low";
      sustainability: "High" | "Medium" | "Low";
      rank: number;
    }[];
  } {
    const stripMd = (value: string) =>
      value.replace(/\*\*/g, "").replace(/__/g, "").replace(/\s+/g, " ").trim();

    let raw = (markdown || "").replace(/\r\n/g, "\n").trim();
    raw = raw
      .replace(/^##\s+[^\n]+\n+/, "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .trim();

    const subsection = (aliases: string[]) => {
      const normalizedAliases = aliases.map((a) => a.toLowerCase());
      const lines = raw.split("\n");
      let capturing = false;
      let buffer: string[] = [];

      const flush = () => {
        const text = buffer.join("\n").trim();
        buffer = [];
        capturing = false;
        return text;
      };

      for (const line of lines) {
        const h3 = line.match(/^###\s+(.+)$/);
        if (h3) {
          if (capturing) return flush();
          const title = h3[1].trim().replace(/^\*+|\*+$/g, "").toLowerCase();
          if (normalizedAliases.some((alias) => title === alias || title.includes(alias))) {
            capturing = true;
          }
          continue;
        }
        if (capturing) buffer.push(line);
      }
      if (capturing) return flush();
      return "";
    };

    const approachSection = subsection([
      "Strategic Approach",
      "Solution Approach",
      "Approach",
      "Solutions Alignment",
    ]);
    const solutionsSection = subsection([
      "Core Solutions",
      "Proposed Solutions",
      "Solution Alignment",
      "Solutions",
      "Ranked Solutions",
    ]);

    let approachIntro = "";
    let solutions: {
      action: string;
      description: string;
      desirability: "High" | "Medium" | "Low";
      equitably: "High" | "Medium" | "Low";
      feasibility: "High" | "Medium" | "Low";
      sustainability: "High" | "Medium" | "Low";
      rank: number;
    }[] = [];

    if (approachSection) {
      const prose = approachSection
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("|") && !/^\s*([-*•]|\d+\.)\s+/.test(line));
      approachIntro = stripMd(prose.join(" "));
    }

    const tableSource = solutionsSection || raw;
    solutions = this.parseSolutionAlignmentRowsFromTable(tableSource);
    if (!solutions.length) {
      solutions = this.parseSolutionAlignmentRowsFromText(solutionsSection || raw);
    }

    if (!approachIntro) {
      const paragraphs = this.parseExecutiveSummaryParagraphs(raw);
      if (paragraphs.length) approachIntro = paragraphs[0];
    }

    return { approachIntro, solutions };
  }

  private buildSolutionsAlignmentFromSessions(
    sessions: ExportSession[],
    artifacts: ExportArtifact[]
  ): {
    approachIntro: string;
    solutions: {
      action: string;
      description: string;
      desirability: "High" | "Medium" | "Low";
      equitably: "High" | "Medium" | "Low";
      feasibility: "High" | "Medium" | "Low";
      sustainability: "High" | "Medium" | "Low";
      rank: number;
    }[];
  } {
    const session7 = sessions.find((s) => s.session_number === 7);
    const source7 = session7 ? this.getSessionSourceText(session7, artifacts) : "";
    const solutions = this.parseSolutionAlignmentRowsFromText(source7).slice(0, 4);

    return {
      approachIntro:
        "Solutions Alignment is the process of selecting the best strategies to address the community's needs. The CARE Team evaluated each solution against desirability, equity, feasibility, and sustainability to identify community-first priorities.",
      solutions,
    };
  }

  private deriveSolutionsAlignmentContent(
    markdown: string,
    sessions: ExportSession[],
    artifacts: ExportArtifact[]
  ): {
    approachIntro: string;
    solutions: {
      action: string;
      description: string;
      desirability: "High" | "Medium" | "Low";
      equitably: "High" | "Medium" | "Low";
      feasibility: "High" | "Medium" | "Low";
      sustainability: "High" | "Medium" | "Low";
      rank: number;
    }[];
  } {
    const PLACEHOLDER = "This section will be developed in upcoming sessions.";
    const isPlaceholder = !markdown.trim() || markdown.trim() === PLACEHOLDER;

    const parsed = isPlaceholder
      ? { approachIntro: "", solutions: [] as ReturnType<typeof this.parseSolutionAlignmentRowsFromText> }
      : this.parseSolutionsAlignmentContent(markdown);

    const sessionFallback = this.buildSolutionsAlignmentFromSessions(sessions, artifacts);

    let approachIntro = parsed.approachIntro || sessionFallback.approachIntro;
    let solutions = parsed.solutions.length ? parsed.solutions : sessionFallback.solutions;

    if (!approachIntro) {
      approachIntro = isPlaceholder
        ? PLACEHOLDER
        : "Solutions Alignment is the process of selecting the best strategies to address the community's needs. The CARE Team evaluated each solution against desirability, equity, feasibility, and sustainability.";
    }

    if (!solutions.length) {
      solutions = [
        {
          action: "ADVOCATE",
          description: PLACEHOLDER,
          desirability: "High",
          equitably: "High",
          feasibility: "Medium",
          sustainability: "High",
          rank: 1,
        },
      ];
    }

    return {
      approachIntro: this.fitAssessmentCardText(approachIntro, 520),
      solutions: solutions.slice(0, 4).map((row, index) => ({
        ...row,
        action: this.fitAssessmentCardText(row.action, 24),
        description: this.fitAssessmentCardText(row.description, index === 0 ? 280 : 240),
        rank: row.rank || index + 1,
      })),
    };
  }

  private async spRenderProposedSolutionsPage(
    markdown: string,
    pageLabel: number,
    sessions: ExportSession[],
    artifacts: ExportArtifact[]
  ) {
    const PLACEHOLDER = "This section will be developed in upcoming sessions.";
    const { approachIntro, solutions } = this.deriveSolutionsAlignmentContent(
      markdown,
      sessions,
      artifacts
    );

    const dataUrl = await renderPdfProposedSolutionsPageToDataUrl({
      pageNumber: pageLabel,
      footerDate: formatCoverDate(this.spCover),
      approachIntro: approachIntro || PLACEHOLDER,
      solutions,
    });

    this.doc.addPage();
    this.pageNum++;
    this.doc.addImage(dataUrl, "PNG", 0, 0, this.pageWidth, this.pageHeight, undefined, "FAST");
  }

  private parseImplementationRoadmapContent(markdown: string): {
    roadmapOverview: string;
    communityAssets: string;
    timelineRoles: string;
    dataAccountability: string;
  } {
    const stripMd = (value: string) =>
      value.replace(/\*\*/g, "").replace(/__/g, "").replace(/\s+/g, " ").trim();

    let raw = (markdown || "").replace(/\r\n/g, "\n").trim();
    raw = raw
      .replace(/^##\s+[^\n]+\n+/, "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .trim();

    const subsection = (aliases: string[]) => {
      const normalizedAliases = aliases.map((a) => a.toLowerCase());
      const lines = raw.split("\n");
      let capturing = false;
      let buffer: string[] = [];

      const flush = () => {
        const text = stripMd(buffer.join(" ").trim());
        buffer = [];
        capturing = false;
        return text;
      };

      for (const line of lines) {
        const h3 = line.match(/^###\s+(.+)$/);
        if (h3) {
          if (capturing) return flush();
          const title = h3[1].trim().replace(/^\*+|\*+$/g, "").toLowerCase();
          if (normalizedAliases.some((alias) => title === alias || title.includes(alias))) {
            capturing = true;
          }
          continue;
        }
        if (capturing && line.trim()) buffer.push(line.trim());
      }
      if (capturing) return flush();
      return "";
    };

    let roadmapOverview = subsection([
      "Roadmap Overview",
      "Implementation Overview",
      "Overview",
      "Implementation Roadmap",
      "Our Approach",
    ]);
    let communityAssets = subsection([
      "Community Assets",
      "Assets & Capacity",
      "Community Assets & Capacity",
      "Mobilizing Assets",
    ]);
    let timelineRoles = subsection([
      "Timeline & Roles",
      "Timeline and Roles",
      "Timeline",
      "Roles & Responsibilities",
      "Who Does What",
      "Execution Plan",
    ]);
    let dataAccountability = subsection([
      "Data & Accountability",
      "Data and Accountability",
      "Data Collection",
      "Measurement Plan",
      "Accountability",
    ]);

    const paragraphs = this.parseExecutiveSummaryParagraphs(raw);

    if (!roadmapOverview && !communityAssets && !timelineRoles && !dataAccountability) {
      if (paragraphs.length >= 4) {
        [roadmapOverview, communityAssets, timelineRoles, dataAccountability] = paragraphs.slice(0, 4);
      } else if (paragraphs.length === 3) {
        [roadmapOverview, communityAssets, timelineRoles] = paragraphs;
      } else if (paragraphs.length === 2) {
        roadmapOverview = paragraphs[0];
        communityAssets = paragraphs[1];
      } else if (paragraphs.length === 1) {
        roadmapOverview = paragraphs[0];
      }
    } else {
      if (!roadmapOverview && paragraphs[0]) roadmapOverview = paragraphs[0];
      if (!communityAssets && paragraphs[1]) communityAssets = paragraphs[1];
      if (!timelineRoles && paragraphs[2]) timelineRoles = paragraphs[2];
      if (!dataAccountability && paragraphs[3]) dataAccountability = paragraphs[3];
    }

    if (!roadmapOverview && !communityAssets && !timelineRoles && !dataAccountability && raw) {
      roadmapOverview = stripMd(raw);
    }

    return { roadmapOverview, communityAssets, timelineRoles, dataAccountability };
  }

  private buildImplementationRoadmapFromSessions(
    sessions: ExportSession[],
    artifacts: ExportArtifact[]
  ): {
    roadmapOverview: string;
    communityAssets: string;
    timelineRoles: string;
    dataAccountability: string;
  } {
    const textFor = (sessionNumber: number) => {
      const session = sessions.find((s) => s.session_number === sessionNumber);
      return session ? this.getSessionSourceText(session, artifacts) : "";
    };

    return {
      roadmapOverview: "",
      communityAssets: textFor(6),
      timelineRoles: textFor(8) || textFor(9),
      dataAccountability: textFor(11),
    };
  }

  private deriveImplementationRoadmapContent(
    markdown: string,
    sessions: ExportSession[],
    artifacts: ExportArtifact[]
  ): {
    roadmapOverview: string;
    communityAssets: string;
    timelineRoles: string;
    dataAccountability: string;
  } {
    const PLACEHOLDER = "This section will be developed in upcoming sessions.";
    const isPlaceholder = !markdown.trim() || markdown.trim() === PLACEHOLDER;

    let parsed = isPlaceholder
      ? { roadmapOverview: "", communityAssets: "", timelineRoles: "", dataAccountability: "" }
      : this.parseImplementationRoadmapContent(markdown);

    const sessionFallback = this.buildImplementationRoadmapFromSessions(sessions, artifacts);

    const merged = {
      roadmapOverview: parsed.roadmapOverview || sessionFallback.roadmapOverview,
      communityAssets: parsed.communityAssets || sessionFallback.communityAssets,
      timelineRoles: parsed.timelineRoles || sessionFallback.timelineRoles,
      dataAccountability: parsed.dataAccountability || sessionFallback.dataAccountability,
    };

    if (!merged.roadmapOverview) {
      merged.roadmapOverview =
        "This roadmap translates community priorities into action — mobilizing existing assets, assigning clear roles, and building accountability through transparent data practices.";
    }

    if (merged.communityAssets && merged.timelineRoles === merged.communityAssets) {
      const paragraphs = this.parseExecutiveSummaryParagraphs(merged.communityAssets);
      if (paragraphs.length >= 2) {
        merged.communityAssets = paragraphs[0];
        merged.timelineRoles = paragraphs[1];
      }
    }

    if (merged.dataAccountability && merged.timelineRoles === merged.dataAccountability) {
      const paragraphs = this.parseExecutiveSummaryParagraphs(merged.dataAccountability);
      if (paragraphs.length >= 2) {
        merged.timelineRoles = paragraphs[0];
        merged.dataAccountability = paragraphs[1];
      }
    }

    return {
      roadmapOverview: merged.roadmapOverview || PLACEHOLDER,
      communityAssets: merged.communityAssets || PLACEHOLDER,
      timelineRoles: merged.timelineRoles || merged.communityAssets || PLACEHOLDER,
      dataAccountability: merged.dataAccountability || PLACEHOLDER,
    };
  }

  private async spRenderImplementationRoadmapPage(
    markdown: string,
    pageLabel: number,
    sessions: ExportSession[],
    artifacts: ExportArtifact[]
  ) {
    const PLACEHOLDER = "This section will be developed in upcoming sessions.";
    const fields = this.deriveImplementationRoadmapContent(markdown, sessions, artifacts);
    const fit = (value: string, max = 520) =>
      this.fitAssessmentCardText(value.trim() || PLACEHOLDER, max);

    const dataUrl = await renderPdfImplementationRoadmapPageToDataUrl({
      pageNumber: pageLabel,
      footerDate: formatCoverDate(this.spCover),
      roadmapOverview: fit(fields.roadmapOverview, 380),
      communityAssets: fit(fields.communityAssets, 420),
      timelineRoles: fit(fields.timelineRoles, 420),
      dataAccountability: fit(fields.dataAccountability, 320),
    });

    this.doc.addPage();
    this.pageNum++;
    this.doc.addImage(dataUrl, "PNG", 0, 0, this.pageWidth, this.pageHeight, undefined, "FAST");
  }

  private splitMetricLabelAndDescription(content: string): { metric: string; description: string } {
    const cleaned = this.cleanAssessmentDisplayText(content);
    const bold = content.match(/\*\*([^*]+)\*\*/);
    if (bold) {
      const words = bold[1].trim().split(/\s+/);
      const metric = (words.length > 1 ? words.slice(0, 2).join(" ") : words[0] || "METRIC").toUpperCase();
      const description = cleaned
        .replace(bold[0], "")
        .replace(/^[—–:-]\s*/, "")
        .trim();
      return { metric, description };
    }

    const dashParts = cleaned
      .split(/\s*[—–-]\s+/)
      .map((part) => part.trim())
      .filter(Boolean);
    if (dashParts.length >= 2) {
      const metric = dashParts[0].split(/\s+/).slice(0, 2).join(" ").toUpperCase();
      return { metric, description: dashParts.slice(1).join(" — ") };
    }

    const words = cleaned.split(/\s+/);
    const metric = words.slice(0, 2).join(" ").toUpperCase() || "METRIC";
    const description = words.slice(2).join(" ");
    return { metric, description: description || cleaned };
  }

  private extractMetricFields(text: string): {
    indicator?: string;
    target?: string;
    method?: string;
    frequency?: string;
  } {
    const pick = (patterns: RegExp[]) => {
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match?.[1]) return this.cleanAssessmentDisplayText(match[1]);
      }
      return undefined;
    };

    return {
      indicator: pick([
        /indicator\s*[:=]\s*([^—–|\n]+)/i,
        /success signal\s*[:=]\s*([^—–|\n]+)/i,
      ]),
      target: pick([
        /target\s*[:=]\s*([^—–|\n]+)/i,
        /goal\s*[:=]\s*([^—–|\n]+)/i,
      ]),
      method: pick([
        /(?:method|tracked via|how)\s*[:=]\s*([^—–|\n]+)/i,
        /captured via\s*[:=]\s*([^—–|\n]+)/i,
      ]),
      frequency: pick([
        /(?:frequency|when)\s*[:=]\s*([^—–|\n]+)/i,
        /(?:schedule|timing)\s*[:=]\s*([^—–|\n]+)/i,
      ]),
    };
  }

  private defaultMetricFields(index: number): {
    indicator: string;
    target: string;
    method: string;
    frequency: string;
  } {
    const presets = [
      {
        indicator: "Participation trend",
        target: "Increase over baseline",
        method: "Sign-in logs",
        frequency: "Each session",
      },
      {
        indicator: "Skill improvement",
        target: "Measurable gain",
        method: "Pre/post assessment",
        frequency: "Quarterly",
      },
      {
        indicator: "Community voice",
        target: "Positive feedback",
        method: "Check-in survey",
        frequency: "Monthly",
      },
      {
        indicator: "Sustained engagement",
        target: "80% retention",
        method: "Facilitator records",
        frequency: "Ongoing",
      },
    ];
    return presets[index] ?? presets[presets.length - 1];
  }

  private parseMeasurementRowsFromTable(raw: string): {
    metric: string;
    description: string;
    indicator: string;
    target: string;
    method: string;
    frequency: string;
    rank: number;
  }[] {
    const rows: {
      metric: string;
      description: string;
      indicator: string;
      target: string;
      method: string;
      frequency: string;
      rank: number;
    }[] = [];

    const lines = raw.split("\n").filter((line) => line.trim().startsWith("|"));
    if (lines.length < 2) return rows;

    const splitRow = (line: string) =>
      line
        .split("|")
        .map((cell) => cell.trim())
        .filter((cell, index, arr) => !(index === 0 && cell === "") && !(index === arr.length - 1 && cell === ""));

    const header = splitRow(lines[0]).map((cell) => cell.toLowerCase());
    const dataLines = lines.slice(1).filter((line) => !/^[-:| ]+$/.test(line.trim()));

    const idx = (aliases: string[]) =>
      header.findIndex((cell) => aliases.some((alias) => cell.includes(alias)));

    const metricIdx = idx(["metric"]);
    const indicatorIdx = idx(["indicator"]);
    const targetIdx = idx(["target"]);
    const methodIdx = idx(["method", "how"]);
    const frequencyIdx = idx(["frequency", "when", "timing"]);
    const rankIdx = idx(["rank", "priority"]);

    dataLines.forEach((line, index) => {
      const cells = splitRow(line);
      if (!cells.length) return;
      const metricCell = cells[metricIdx >= 0 ? metricIdx : 0] || "";
      const { metric, description } = this.splitMetricLabelAndDescription(metricCell);
      const inline = this.extractMetricFields(metricCell);
      const defaults = this.defaultMetricFields(index);
      rows.push({
        metric,
        description,
        indicator:
          (indicatorIdx >= 0 ? this.cleanAssessmentDisplayText(cells[indicatorIdx] || "") : inline.indicator) ||
          defaults.indicator,
        target:
          (targetIdx >= 0 ? this.cleanAssessmentDisplayText(cells[targetIdx] || "") : inline.target) ||
          defaults.target,
        method:
          (methodIdx >= 0 ? this.cleanAssessmentDisplayText(cells[methodIdx] || "") : inline.method) ||
          defaults.method,
        frequency:
          (frequencyIdx >= 0 ? this.cleanAssessmentDisplayText(cells[frequencyIdx] || "") : inline.frequency) ||
          defaults.frequency,
        rank: rankIdx >= 0 ? Number(cells[rankIdx]) || index + 1 : index + 1,
      });
    });

    return rows;
  }

  private parseMeasurementRowsFromText(text: string): {
    metric: string;
    description: string;
    indicator: string;
    target: string;
    method: string;
    frequency: string;
    rank: number;
  }[] {
    const rows: {
      metric: string;
      description: string;
      indicator: string;
      target: string;
      method: string;
      frequency: string;
      rank: number;
    }[] = [];

    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const bullet = trimmed.match(/^\s*([-*•]|\d+\.)\s+(.+)$/);
      const content = bullet ? bullet[2] : trimmed;
      if (!content || /^#{1,3}\s/.test(content)) continue;

      const { metric, description } = this.splitMetricLabelAndDescription(content);
      const fields = this.extractMetricFields(content);
      const defaults = this.defaultMetricFields(rows.length);
      const cleanDescription = description
        .replace(/target\s*[:=][^—–|]+/gi, "")
        .replace(/(?:method|tracked via|how)\s*[:=][^—–|]+/gi, "")
        .replace(/(?:frequency|when)\s*[:=][^—–|]+/gi, "")
        .replace(/indicator\s*[:=][^—–|]+/gi, "")
        .trim();

      rows.push({
        metric,
        description: cleanDescription,
        indicator: fields.indicator || defaults.indicator,
        target: fields.target || defaults.target,
        method: fields.method || defaults.method,
        frequency: fields.frequency || defaults.frequency,
        rank: rows.length + 1,
      });
    }

    return rows;
  }

  private parseMeasurementContent(markdown: string): {
    approachIntro: string;
    metrics: {
      metric: string;
      description: string;
      indicator: string;
      target: string;
      method: string;
      frequency: string;
      rank: number;
    }[];
  } {
    const stripMd = (value: string) =>
      value.replace(/\*\*/g, "").replace(/__/g, "").replace(/\s+/g, " ").trim();

    let raw = (markdown || "").replace(/\r\n/g, "\n").trim();
    raw = raw
      .replace(/^##\s+[^\n]+\n+/, "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .trim();

    const subsection = (aliases: string[]) => {
      const normalizedAliases = aliases.map((a) => a.toLowerCase());
      const lines = raw.split("\n");
      let capturing = false;
      let buffer: string[] = [];

      const flush = () => {
        const text = buffer.join("\n").trim();
        buffer = [];
        capturing = false;
        return text;
      };

      for (const line of lines) {
        const h3 = line.match(/^###\s+(.+)$/);
        if (h3) {
          if (capturing) return flush();
          const title = h3[1].trim().replace(/^\*+|\*+$/g, "").toLowerCase();
          if (normalizedAliases.some((alias) => title === alias || title.includes(alias))) {
            capturing = true;
          }
          continue;
        }
        if (capturing) buffer.push(line);
      }
      if (capturing) return flush();
      return "";
    };

    const approachSection = subsection([
      "Measurement Approach",
      "Success Framework",
      "Approach",
      "Overview",
    ]);
    const metricsSection = subsection([
      "Success Indicators",
      "Key Metrics",
      "Core Metrics",
      "Metrics",
      "Measurement Table",
    ]);

    let approachIntro = "";
    let metrics: ReturnType<typeof this.parseMeasurementRowsFromText> = [];

    if (approachSection) {
      const prose = approachSection
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("|") && !/^\s*([-*•]|\d+\.)\s+/.test(line));
      approachIntro = stripMd(prose.join(" "));
    }

    const tableSource = metricsSection || raw;
    metrics = this.parseMeasurementRowsFromTable(tableSource);
    if (!metrics.length) {
      metrics = this.parseMeasurementRowsFromText(metricsSection || raw);
    }

    if (!approachIntro) {
      const paragraphs = this.parseExecutiveSummaryParagraphs(raw);
      if (paragraphs.length) approachIntro = paragraphs[0];
    }

    return { approachIntro, metrics };
  }

  private buildMeasurementFromSessions(
    sessions: ExportSession[],
    artifacts: ExportArtifact[]
  ): {
    approachIntro: string;
    metrics: ReturnType<typeof this.parseMeasurementRowsFromText>;
  } {
    const session10 = sessions.find((s) => s.session_number === 10);
    const source10 = session10 ? this.getSessionSourceText(session10, artifacts) : "";
    const metrics = this.parseMeasurementRowsFromText(source10).slice(0, 4);

    return {
      approachIntro:
        "The CARE Team defined community-centered metrics that track meaningful progress without overburdening participants — balancing quantitative data with qualitative signals of success.",
      metrics,
    };
  }

  private deriveMeasurementContent(
    markdown: string,
    sessions: ExportSession[],
    artifacts: ExportArtifact[]
  ): {
    approachIntro: string;
    metrics: ReturnType<typeof this.parseMeasurementRowsFromText>;
  } {
    const PLACEHOLDER = "This section will be developed in upcoming sessions.";
    const isPlaceholder = !markdown.trim() || markdown.trim() === PLACEHOLDER;

    const parsed = isPlaceholder
      ? { approachIntro: "", metrics: [] as ReturnType<typeof this.parseMeasurementRowsFromText> }
      : this.parseMeasurementContent(markdown);

    const sessionFallback = this.buildMeasurementFromSessions(sessions, artifacts);

    let approachIntro = parsed.approachIntro || sessionFallback.approachIntro;
    let metrics = parsed.metrics.length ? parsed.metrics : sessionFallback.metrics;

    if (!approachIntro) {
      approachIntro = isPlaceholder
        ? PLACEHOLDER
        : "The CARE Team defined community-centered metrics that track meaningful progress without overburdening participants.";
    }

    if (!metrics.length) {
      metrics = [
        {
          metric: "IMPACT",
          description: PLACEHOLDER,
          indicator: "Community-defined signal",
          target: "TBD",
          method: "Facilitator logs",
          frequency: "Ongoing",
          rank: 1,
        },
      ];
    }

    return {
      approachIntro: this.fitAssessmentCardText(approachIntro, 520),
      metrics: metrics.slice(0, 4).map((row, index) => ({
        ...row,
        metric: this.fitAssessmentCardText(row.metric, 28),
        description: this.fitAssessmentCardText(row.description, index === 0 ? 200 : 170),
        indicator: this.fitAssessmentCardText(row.indicator, 60),
        target: this.fitAssessmentCardText(row.target, 50),
        method: this.fitAssessmentCardText(row.method, 60),
        frequency: this.fitAssessmentCardText(row.frequency, 40),
        rank: row.rank || index + 1,
      })),
    };
  }

  private getTeamRoleLabel(role: string): string {
    return role === "care_team_leader" ? "CARE Team Leader" : "CARE Team Member";
  }

  private deriveTeamContent(
    teamMembers: TeamMember[],
    project: ExportProject
  ): {
    introText: string;
    teamRows: {
      name: string;
      roleLabel: string;
      email: string;
      rank: number;
    }[];
    acknowledgmentText: string;
  } {
    const orgName = project.organizations?.name?.trim() || "the community";
    const leaders = teamMembers.filter((m) => m.role === "care_team_leader");
    const members = teamMembers.filter((m) => m.role !== "care_team_leader");
    const sorted = [...leaders, ...members];

    if (!sorted.length) {
      return {
        introText:
          "Team roster is not yet available. Invite your CARE Team members from the project page to populate this section.",
        teamRows: [],
        acknowledgmentText: "",
      };
    }

    const introText = `This strategic plan reflects the collective effort of ${sorted.length} CARE Team member${sorted.length === 1 ? "" : "s"} who partnered with ${orgName} to listen, design, and build community-centered solutions.`;

    const acknowledgmentText =
      "We extend our deepest gratitude to every team member whose time, expertise, and lived experience shaped this plan.";

    const maxRows = sorted.length > 10 ? 10 : sorted.length;

    return {
      introText: this.fitAssessmentCardText(introText, 520),
      teamRows: sorted.slice(0, maxRows).map((member, index) => ({
        name: this.fitAssessmentCardText(
          member.full_name?.trim() || member.email.split("@")[0] || "Team Member",
          36
        ),
        roleLabel: this.getTeamRoleLabel(member.role),
        email: this.fitAssessmentCardText(member.email, 42),
        rank: index + 1,
      })),
      acknowledgmentText: this.fitAssessmentCardText(acknowledgmentText, 220),
    };
  }

  private async spRenderTeamPage(
    teamMembers: TeamMember[],
    pageLabel: number,
    project: ExportProject
  ) {
    const { introText, teamRows, acknowledgmentText } = this.deriveTeamContent(
      teamMembers,
      project
    );

    const dataUrl = await renderPdfTeamPageToDataUrl({
      pageNumber: pageLabel,
      footerDate: formatCoverDate(this.spCover),
      introText,
      teamRows,
      acknowledgmentText: teamRows.length ? acknowledgmentText : undefined,
    });

    this.doc.addPage();
    this.pageNum++;
    this.doc.addImage(dataUrl, "PNG", 0, 0, this.pageWidth, this.pageHeight, undefined, "FAST");
  }

  private deriveClosingContent(project: ExportProject): {
    thankYouText: string;
    livingDocumentText: string;
    links: { label: string; detail: string }[];
  } {
    const orgName = project.organizations?.name?.trim() || "your organization";
    const orgLoc = project.organizations?.location?.trim() || "";

    const thankYouText = `Thank you for completing the MEASURE CARE Model Strategic Planning process with ${orgName}${orgLoc ? ` (${orgLoc})` : ""}.`;

    const livingDocumentText =
      "This Strategic Plan reflects the voices and expertise of the community it serves. Use it as a living document — revisit it as conditions change, share it with stakeholders, and let it guide both daily decisions and long-term advocacy.";

    return {
      thankYouText: this.fitAssessmentCardText(thankYouText, 420),
      livingDocumentText: this.fitAssessmentCardText(livingDocumentText, 620),
      links: [
        { label: "MEASURE", detail: "wemeasure.org" },
        {
          label: "CARE Model",
          detail: "Curriculum & coaching through your CARE Model portal",
        },
        {
          label: "Data Commons",
          detail: "Share anonymized learnings · 25% community revenue share",
        },
      ],
    };
  }

  private async spRenderClosingPage(pageLabel: number, project: ExportProject) {
    const { thankYouText, livingDocumentText, links } = this.deriveClosingContent(project);

    const dataUrl = await renderPdfClosingPageToDataUrl({
      pageNumber: pageLabel,
      footerDate: formatCoverDate(this.spCover),
      thankYouText,
      livingDocumentText,
      links,
    });

    this.doc.addPage();
    this.pageNum++;
    this.doc.addImage(dataUrl, "PNG", 0, 0, this.pageWidth, this.pageHeight, undefined, "FAST");
  }

  private async spRenderMeasurementPage(
    markdown: string,
    pageLabel: number,
    sessions: ExportSession[],
    artifacts: ExportArtifact[]
  ) {
    const PLACEHOLDER = "This section will be developed in upcoming sessions.";
    const { approachIntro, metrics } = this.deriveMeasurementContent(markdown, sessions, artifacts);

    const dataUrl = await renderPdfMeasurementPageToDataUrl({
      pageNumber: pageLabel,
      footerDate: formatCoverDate(this.spCover),
      approachIntro: approachIntro || PLACEHOLDER,
      metrics,
    });

    this.doc.addPage();
    this.pageNum++;
    this.doc.addImage(dataUrl, "PNG", 0, 0, this.pageWidth, this.pageHeight, undefined, "FAST");
  }

  private async spRenderStakeholderAnalysisPage(
    markdown: string,
    pageLabel: number,
    sessions: ExportSession[],
    artifacts: ExportArtifact[]
  ) {
    const PLACEHOLDER = "This section will be developed in upcoming sessions.";
    const { engagementIntro, stakeholders } = this.deriveStakeholderContent(
      markdown,
      sessions,
      artifacts
    );

    const dataUrl = await renderPdfStakeholderAnalysisPageToDataUrl({
      pageNumber: pageLabel,
      footerDate: formatCoverDate(this.spCover),
      engagementIntro: engagementIntro || PLACEHOLDER,
      stakeholders: stakeholders.length
        ? stakeholders
        : [{ name: "Stakeholders", role: "Session 4", engagement: PLACEHOLDER }],
      engagementHighlight: this.deriveStakeholderHighlight(engagementIntro, stakeholders),
    });

    this.doc.addPage();
    this.pageNum++;
    this.doc.addImage(dataUrl, "PNG", 0, 0, this.pageWidth, this.pageHeight, undefined, "FAST");
  }

  private async renderStrategicPlanFixed15(
    project: ExportProject,
    sessions: ExportSession[],
    narrative: string,
    teamMembers: TeamMember[],
    artifacts: ExportArtifact[] = []
  ) {
    let pre = (narrative || "").replace(/\r\n/g, "\n").trim();
    const outerFence = pre.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n?```\s*$/i);
    if (outerFence) pre = outerFence[1].trim();
    // Strip a leading H1 document title only (single #) — preamble is preserved
    pre = pre.replace(/^\s*#(?!#)\s+[^\n]+\n+/, "").trim();

    const PLACEHOLDER = "This section will be developed in upcoming sessions.";

    const rawFound = this.parseNarrativeSections(pre);

    const ALIASES: Record<string, string[]> = {
      "executive summary": [
        "executive summary",
        "summary",
        "executive overview",
        "overview",
      ],
      mission: ["mission", "our mission", "organization mission & vision", "mission & vision"],
      assessment: [
        "assessment",
        "community context & assessment",
        "community context",
        "community context and assessment",
        "population served",
        "community served",
        "who we serve",
      ],
      stakeholders: ["stakeholders", "stakeholder analysis", "invested parties"],
      problem: [
        "problem",
        "root cause & problem framing",
        "root cause and problem framing",
        "problem (opportunity)",
        "problem statement",
        "the problem",
      ],
      solutions: ["solutions", "proposed solutions", "solutions discussion", "solutions alignment"],
      implementation: [
        "implementation",
        "implementation roadmap",
        "implementation plan",
        "data collection plan",
      ],
      measurement: [
        "measurement",
        "measurement & success indicators",
        "measurement and success indicators",
        "community impact metrics",
        "metrics",
      ],
    };

    const found = new Map<string, string>();
    for (const [title, body] of rawFound.entries()) {
      const key = this.resolveNarrativeKey(title, ALIASES) ?? title;
      const existing = found.get(key);
      if (!existing || (!existing.trim() && body.trim())) {
        found.set(key, body);
      }
    }

    const sectionBody = (key: string): string => {
      const body = found.get(key.toLowerCase());
      if (body?.trim()) return body.trim();
      return PLACEHOLDER;
    };

    // ── PAGE 4: Table of Contents ──
    this.spStartSectionPage("Table of Contents", 4);
    const tocItems: { label: string; page: number }[] = [
      { label: "Executive Summary", page: 5 },
      { label: "Organization Mission & Vision", page: 6 },
      { label: "Community Context & Assessment", page: 7 },
      { label: "Stakeholder Analysis", page: 8 },
      { label: "Root Cause & Problem Framing", page: 9 },
      { label: "Proposed Solutions", page: 10 },
      { label: "Implementation Roadmap", page: 11 },
      { label: "Action Items & Next Steps", page: 12 },
      { label: "Measurement & Success Indicators", page: 13 },
      { label: "Team & Acknowledgments", page: 14 },
      { label: "Closing / Call to Action / Contact", page: 15 },
    ];
    this.doc.setTextColor(...COLORS.bodyText);
    this.doc.setFont("Outfit", "normal");
    this.doc.setFontSize(this.SP_BODY_SIZE);
    const rowH = 26;
    for (const item of tocItems) {
      const labelY = this.y + this.SP_BODY_SIZE;
      this.doc.setFont("Outfit", "bold");
      this.doc.setTextColor(...COLORS.darkCornflower);
      this.doc.text(String(item.page).padStart(2, "0"), this.SP_MARGIN, labelY);
      this.doc.setFont("Outfit", "normal");
      this.doc.setTextColor(...COLORS.darkText);
      this.doc.text(item.label, this.SP_MARGIN + 36, labelY);
      const dotsStart = this.SP_MARGIN + 36 + this.doc.getTextWidth(item.label) + 8;
      const dotsEnd = this.pageWidth - this.SP_MARGIN - 24;
      this.doc.setTextColor(190, 190, 200);
      let dx = dotsStart;
      while (dx < dotsEnd) {
        this.doc.text(".", dx, labelY);
        dx += 5;
      }
      this.doc.setTextColor(...COLORS.darkCornflower);
      this.doc.setFont("Outfit", "bold");
      this.doc.text(String(item.page), this.pageWidth - this.SP_MARGIN, labelY, { align: "right" });
      this.y += rowH;
    }

    // ── PAGES 5–11: AI narrative sections ──
    const aiPages: { bannerTitle: string; narrativeKey: string; page: number }[] = [
      { bannerTitle: "Executive Summary", narrativeKey: "executive summary", page: 5 },
      { bannerTitle: "Organization Mission & Vision", narrativeKey: "mission", page: 6 },
      { bannerTitle: "Community Context & Assessment", narrativeKey: "assessment", page: 7 },
      { bannerTitle: "Stakeholder Analysis", narrativeKey: "stakeholders", page: 8 },
      { bannerTitle: "Root Cause & Problem Framing", narrativeKey: "problem", page: 9 },
      { bannerTitle: "Proposed Solutions", narrativeKey: "solutions", page: 10 },
      { bannerTitle: "Implementation Roadmap", narrativeKey: "implementation", page: 11 },
    ];
    for (const s of aiPages) {
      if (s.page === 5) {
        await this.spRenderExecutiveSummaryPage(
          sectionBody(s.narrativeKey),
          s.page,
          project,
          teamMembers
        );
        continue;
      }
      if (s.page === 6) {
        await this.spRenderMissionVisionPage(sectionBody(s.narrativeKey), s.page, project, {
          solutions: sectionBody("solutions"),
          problem: sectionBody("problem"),
          assessment: sectionBody("assessment"),
        });
        continue;
      }
      if (s.page === 7) {
        await this.spRenderCommunityAssessmentPage(
          sectionBody(s.narrativeKey),
          s.page,
          sessions,
          artifacts
        );
        continue;
      }
      if (s.page === 8) {
        await this.spRenderStakeholderAnalysisPage(
          sectionBody(s.narrativeKey),
          s.page,
          sessions,
          artifacts
        );
        continue;
      }
      if (s.page === 9) {
        await this.spRenderProblemFramingPage(
          sectionBody(s.narrativeKey),
          s.page,
          sessions,
          artifacts
        );
        continue;
      }
      if (s.page === 10) {
        await this.spRenderProposedSolutionsPage(
          sectionBody(s.narrativeKey),
          s.page,
          sessions,
          artifacts
        );
        continue;
      }
      if (s.page === 11) {
        await this.spRenderImplementationRoadmapPage(
          sectionBody(s.narrativeKey),
          s.page,
          sessions,
          artifacts
        );
        continue;
      }
      this.spStartSectionPage(s.bannerTitle, s.page);
      this.spRenderFittedBody(sectionBody(s.narrativeKey));
    }

    // ── PAGE 12: Action Items & Next Steps ──
    this.spStartSectionPage("Action Items & Next Steps", 12);
    const actionItems = (sessions || [])
      .filter((s) => s.next_steps && s.next_steps.trim())
      .map((s) => ({ session: s.session_number, name: s.session_name, text: s.next_steps!.trim() }));
    if (actionItems.length === 0) {
      this.spRenderFittedBody(PLACEHOLDER);
    } else {
      this.spRenderActionItems(actionItems);
    }

    // ── PAGE 13: Measurement & Success Indicators ──
    await this.spRenderMeasurementPage(sectionBody("measurement"), 13, sessions, artifacts);

    // ── PAGE 14: Team & Acknowledgments ──
    await this.spRenderTeamPage(teamMembers ?? [], 14, project);

    // ── PAGE 15: Closing / Call to Action / Contact ──
    await this.spRenderClosingPage(15, project);
  }
}


export function triggerPdfDownload(pdfBlob: Blob, filename: string) {
  if (typeof document === "undefined") return;

  const pdfUrl = URL.createObjectURL(pdfBlob);
  const link = document.createElement("a");
  link.href = pdfUrl;
  link.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  link.rel = "noopener noreferrer";
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();

  window.setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(pdfUrl);
  }, 30000);
}

export interface PdfPreviewData {
  blobUrl: string;
  previewUrl?: string;
  filename: string;
  project: ExportProject;
  sessions: ExportSession[];
  artifacts: ExportArtifact[];
  interrogations: ExportInterrogation[];
  mode: PdfMode;
  narrative?: string;
  cover?: CoverDetails;
  teamMembers?: TeamMember[];
}

export async function generateProjectPdfPreview(
  project: ExportProject,
  sessions: ExportSession[],
  artifacts: ExportArtifact[],
  interrogations: ExportInterrogation[],
  mode: PdfMode = "draft",
  narrative?: string,
  cover?: CoverDetails,
  teamMembers: TeamMember[] = []
): Promise<PdfPreviewData> {
  const builder = new PdfBuilder();
  await builder.build(project, sessions, artifacts, interrogations, mode, narrative, cover, teamMembers);
  const safeName = project.name.replace(/[^a-z0-9]/gi, "_");
  const suffix = mode === "polished" ? "Strategic_Plan" : "Working_Draft";
  const filename = `${safeName}_${suffix}.pdf`;
  const blobUrl = builder.getBlobUrl();
  return {
    blobUrl,
    previewUrl: blobUrl,
    filename,
    project,
    sessions,
    artifacts,
    interrogations,
    mode,
    narrative,
    cover,
    teamMembers,
  };
}

export async function rebuildPdfPreview(
  project: ExportProject,
  sessions: ExportSession[],
  artifacts: ExportArtifact[],
  interrogations: ExportInterrogation[],
  oldBlobUrl?: string,
  mode: PdfMode = "draft",
  narrative?: string,
  cover?: CoverDetails,
  teamMembers: TeamMember[] = []
): Promise<{ blobUrl: string; previewUrl: string; builder: PdfBuilder }> {
  if (oldBlobUrl) URL.revokeObjectURL(oldBlobUrl);
  const builder = new PdfBuilder();
  await builder.build(project, sessions, artifacts, interrogations, mode, narrative, cover, teamMembers);
  const blobUrl = builder.getBlobUrl();
  return { blobUrl, previewUrl: blobUrl, builder };
}

export async function createPdfObjectUrl(
  project: ExportProject,
  sessions: ExportSession[],
  artifacts: ExportArtifact[],
  interrogations: ExportInterrogation[],
  mode: PdfMode = "draft",
  narrative?: string,
  cover?: CoverDetails,
  teamMembers: TeamMember[] = []
): Promise<string> {
  const builder = new PdfBuilder();
  await builder.build(project, sessions, artifacts, interrogations, mode, narrative, cover, teamMembers);
  return builder.getBlobUrl();
}

export async function createPdfBlob(
  project: ExportProject,
  sessions: ExportSession[],
  artifacts: ExportArtifact[],
  interrogations: ExportInterrogation[],
  mode: PdfMode = "draft",
  narrative?: string,
  cover?: CoverDetails,
  teamMembers: TeamMember[] = []
): Promise<Blob> {
  const builder = new PdfBuilder();
  await builder.build(project, sessions, artifacts, interrogations, mode, narrative, cover, teamMembers);
  return builder.getBlob();
}

export async function downloadPdf(
  project: ExportProject,
  sessions: ExportSession[],
  artifacts: ExportArtifact[],
  interrogations: ExportInterrogation[],
  filename: string,
  mode: PdfMode = "draft",
  narrative?: string,
  cover?: CoverDetails,
  teamMembers: TeamMember[] = []
) {
  const pdfBlob = await createPdfBlob(
    project,
    sessions,
    artifacts,
    interrogations,
    mode,
    narrative,
    cover,
    teamMembers
  );
  triggerPdfDownload(pdfBlob, filename);
}


