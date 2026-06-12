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

  constructor() {
    this.doc = new jsPDF({ unit: "pt", format: "letter" });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.contentWidth = this.pageWidth - this.margin * 2;
    this.y = this.margin;

    // Register Dancing Script cursive font for signature
    this.doc.addFileToVFS("DancingScript.ttf", DANCING_SCRIPT_BASE64);
    this.doc.addFont("DancingScript.ttf", "DancingScript", "normal");

    // Register Outfit (MEASURE brand font) — used by the fixed 16-page Strategic Plan
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

  build(
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
    this.buildCoverPage(project, completedCount, progressPercent, cover);

    // ═══ PAGE 2: LETTER OF ACKNOWLEDGMENT (full-bleed branded image) ═══
    this.doc.addPage();
    this.pageNum++;
    this.doc.addImage(PDF_STATIC_PAGE_2, "JPEG", 0, 0, this.pageWidth, this.pageHeight);

    // ═══ PAGE 3: ABOUT MEASURE & CARE MODEL (full-bleed branded image) ═══
    this.doc.addPage();
    this.pageNum++;
    this.doc.addImage(PDF_STATIC_PAGE_3, "JPEG", 0, 0, this.pageWidth, this.pageHeight);

    // ═══ POLISHED MODE: fixed 16-page Strategic Plan, one section per page ═══
    if (this.mode === "polished" && narrative && narrative.trim()) {
      this.renderStrategicPlanFixed16(project, sessions, narrative, teamMembers);
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

  private buildCoverPage(
    project: ExportProject,
    _completedCount: number,
    _progressPercent: number,
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
  // FIXED 16-PAGE STRATEGIC PLAN RENDERER
  //   Pages 1–3 are produced by build() (cover + 2 static branded images).
  //   This method produces pages 4–16, one section per page:
  //     4: Table of Contents
  //     5–11: AI sections 1–7 (Executive Summary, Mission, Problem,
  //            Population Served, Stakeholders, Solutions, Theory of Change)
  //     12: Action Items (from sessions.next_steps)
  //     13: AI section 8 (Implementation)
  //     14: AI section 9 (Measurement)
  //     15: Team Roster (from project_members)
  //     16: Closing / Contact
  //   Every page 4–16 carries the navy banner + wordmark footer with page #.
  //   Body type: Outfit 11pt, 1.5 line height, 0.75" margins (54pt).
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
    this.doc.text(`PAGE ${pageLabel} OF 16`, this.pageWidth - this.SP_MARGIN, footerY, { align: "right" });
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
      // Truncate blocks until they fit
      while (blocks.length > 0 && measure(blocks, chosen) > maxH) {
        const last = blocks[blocks.length - 1];
        if (last.kind === "para" && last.text.length > 40) {
          last.text = last.text.slice(0, Math.max(40, last.text.length - 80)).replace(/\s+\S*$/, "") + "…";
          if (measure(blocks, chosen) <= maxH) break;
        }
        blocks.pop();
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

  private renderStrategicPlanFixed16(
    project: ExportProject,
    sessions: ExportSession[],
    narrative: string,
    teamMembers: TeamMember[]
  ) {
    // Parse the 9 ## sections produced by the edge function
    let pre = (narrative || "").replace(/\r\n/g, "\n").trim();
    const outerFence = pre.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n?```\s*$/i);
    if (outerFence) pre = outerFence[1].trim();
    pre = pre.replace(/^\s*#\s+[^\n]+\n+/, "").trim();

    const REQUIRED = [
      "Executive Summary",
      "Mission",
      "Problem",
      "Population Served",
      "Stakeholders",
      "Solutions",
      "Theory of Change",
      "Implementation",
      "Measurement",
    ];
    const PLACEHOLDER = "This section will be developed in upcoming sessions.";

    const found = new Map<string, string>();
    for (const block of pre.split(/\n(?=##\s)/)) {
      const m = block.match(/^##\s+(.+?)\n?([\s\S]*)$/);
      if (!m) continue;
      found.set(m[1].trim().toLowerCase(), (m[2] || "").trim());
    }
    const sectionBody = (title: string): string => {
      const body = found.get(title.toLowerCase());
      return body && body.trim() ? body.trim() : PLACEHOLDER;
    };

    // ── PAGE 4: Table of Contents ──
    this.spStartSectionPage("Table of Contents", 4);
    const tocItems: { label: string; page: number }[] = [
      { label: "Executive Summary", page: 5 },
      { label: "Mission", page: 6 },
      { label: "Problem", page: 7 },
      { label: "Population Served", page: 8 },
      { label: "Stakeholders", page: 9 },
      { label: "Solutions", page: 10 },
      { label: "Theory of Change", page: 11 },
      { label: "Action Items", page: 12 },
      { label: "Implementation", page: 13 },
      { label: "Measurement", page: 14 },
      { label: "Team Roster", page: 15 },
      { label: "Closing & Contact", page: 16 },
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
      // Dotted leader
      const dotsStart = this.SP_MARGIN + 36 + this.doc.getTextWidth(item.label) + 8;
      const dotsEnd = this.pageWidth - this.SP_MARGIN - 24;
      this.doc.setTextColor(190, 190, 200);
      let dx = dotsStart;
      while (dx < dotsEnd) {
        this.doc.text(".", dx, labelY);
        dx += 5;
      }
      // Right page number
      this.doc.setTextColor(...COLORS.darkCornflower);
      this.doc.setFont("Outfit", "bold");
      this.doc.text(String(item.page), this.pageWidth - this.SP_MARGIN, labelY, { align: "right" });
      this.y += rowH;
    }

    // ── PAGES 5–11: AI sections 1–7 ──
    const pageMap: { title: string; page: number }[] = [
      { title: "Executive Summary", page: 5 },
      { title: "Mission", page: 6 },
      { title: "Problem", page: 7 },
      { title: "Population Served", page: 8 },
      { title: "Stakeholders", page: 9 },
      { title: "Solutions", page: 10 },
      { title: "Theory of Change", page: 11 },
    ];
    for (const s of pageMap) {
      this.spStartSectionPage(s.title, s.page);
      this.spRenderFittedBody(sectionBody(s.title));
    }

    // ── PAGE 12: Action Items (from sessions.next_steps) ──
    this.spStartSectionPage("Action Items", 12);
    const actionItems = (sessions || [])
      .filter((s) => s.next_steps && s.next_steps.trim())
      .map((s) => ({ session: s.session_number, name: s.session_name, text: s.next_steps!.trim() }));
    if (actionItems.length === 0) {
      this.spRenderFittedBody(PLACEHOLDER);
    } else {
      const blocks = actionItems
        .map(
          (a) =>
            `### Session ${a.session} — ${a.name}\n${a.text}`
        )
        .join("\n\n");
      this.spRenderFittedBody(blocks);
    }

    // ── PAGE 13: Implementation ──
    this.spStartSectionPage("Implementation", 13);
    this.spRenderFittedBody(sectionBody("Implementation"));

    // ── PAGE 14: Measurement ──
    this.spStartSectionPage("Measurement", 14);
    this.spRenderFittedBody(sectionBody("Measurement"));

    // ── PAGE 15: Team Roster (from project_members) ──
    this.spStartSectionPage("Team Roster", 15);
    if (!teamMembers || teamMembers.length === 0) {
      this.spRenderFittedBody(
        "Team roster is not yet available. Invite your CARE Team members from the project page to populate this section."
      );
    } else {
      const leaders = teamMembers.filter((m) => m.role === "care_team_leader");
      const members = teamMembers.filter((m) => m.role !== "care_team_leader");
      const parts: string[] = [];
      if (leaders.length) {
        parts.push(
          "### CARE Team Leaders\n" +
            leaders.map((m) => `- **${m.full_name || m.email}** — ${m.email}`).join("\n")
        );
      }
      if (members.length) {
        parts.push(
          "### CARE Team Members\n" +
            members.map((m) => `- **${m.full_name || m.email}** — ${m.email}`).join("\n")
        );
      }
      this.spRenderFittedBody(parts.join("\n\n"));
    }

    // ── PAGE 16: Closing / Contact ──
    this.spStartSectionPage("Closing & Contact", 16);
    const orgName = project.organizations?.name || "your organization";
    const orgLoc = project.organizations?.location || "";
    const closing = [
      `Thank you for completing the MEASURE CARE Model Strategic Planning process with ${orgName}${orgLoc ? ` (${orgLoc})` : ""}.`,
      "",
      "This Strategic Plan reflects the voices and expertise of the community it serves. Use it as a living document — revisit it as conditions change, share it with stakeholders, and let it guide both daily decisions and long-term advocacy.",
      "",
      "### Stay Connected",
      "- **MEASURE** — wemeasure.org",
      "- **CARE Model Curriculum & Coaching** — connect through your CARE Model portal",
      "- **Community Data Commons** — opt in to share anonymized learnings and receive 25% community revenue share",
      "",
      "*Credit. Consent. Compensation.*",
    ].join("\n");
    this.spRenderFittedBody(closing);
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
  builder.build(project, sessions, artifacts, interrogations, mode, narrative, cover, teamMembers);
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

export function rebuildPdfPreview(
  project: ExportProject,
  sessions: ExportSession[],
  artifacts: ExportArtifact[],
  interrogations: ExportInterrogation[],
  oldBlobUrl?: string,
  mode: PdfMode = "draft",
  narrative?: string,
  cover?: CoverDetails,
  teamMembers: TeamMember[] = []
): { blobUrl: string; previewUrl: string; builder: PdfBuilder } {
  if (oldBlobUrl) URL.revokeObjectURL(oldBlobUrl);
  const builder = new PdfBuilder();
  builder.build(project, sessions, artifacts, interrogations, mode, narrative, cover, teamMembers);
  const blobUrl = builder.getBlobUrl();
  return { blobUrl, previewUrl: blobUrl, builder };
}

export function createPdfObjectUrl(
  project: ExportProject,
  sessions: ExportSession[],
  artifacts: ExportArtifact[],
  interrogations: ExportInterrogation[],
  mode: PdfMode = "draft",
  narrative?: string,
  cover?: CoverDetails,
  teamMembers: TeamMember[] = []
): string {
  const builder = new PdfBuilder();
  builder.build(project, sessions, artifacts, interrogations, mode, narrative, cover, teamMembers);
  return builder.getBlobUrl();
}

export function createPdfBlob(
  project: ExportProject,
  sessions: ExportSession[],
  artifacts: ExportArtifact[],
  interrogations: ExportInterrogation[],
  mode: PdfMode = "draft",
  narrative?: string,
  cover?: CoverDetails,
  teamMembers: TeamMember[] = []
): Blob {
  const builder = new PdfBuilder();
  builder.build(project, sessions, artifacts, interrogations, mode, narrative, cover, teamMembers);
  return builder.getBlob();
}

export function downloadPdf(
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
  const pdfBlob = createPdfBlob(project, sessions, artifacts, interrogations, mode, narrative, cover, teamMembers);
  triggerPdfDownload(pdfBlob, filename);
}


