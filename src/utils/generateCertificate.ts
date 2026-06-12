import jsPDF from "jspdf";
import measureLogo from "@/assets/measure-logo.png";

interface CertParams {
  learnerName: string;
  levelTitle: string;
  levelNumber: number;
  awardedAt: Date;
  verificationCode: string;
  score: number;
}

const NAVY = "#253B96";
const ORANGE = "#E8973E";
const GOLD = "#F9D448";

async function loadImageAsDataUrl(src: string): Promise<string> {
  const res = await fetch(src);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function downloadCertificate(p: CertParams) {
  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "letter" });
  const w = pdf.internal.pageSize.getWidth();
  const h = pdf.internal.pageSize.getHeight();

  // Outer border
  pdf.setDrawColor(NAVY);
  pdf.setLineWidth(6);
  pdf.rect(24, 24, w - 48, h - 48);

  // Inner thin border
  pdf.setDrawColor(GOLD);
  pdf.setLineWidth(1.5);
  pdf.rect(36, 36, w - 72, h - 72);

  // Top accent bar
  pdf.setFillColor(NAVY);
  pdf.rect(36, 36, w - 72, 18, "F");
  pdf.setFillColor(ORANGE);
  pdf.rect(36, 54, w - 72, 4, "F");

  // Logo
  try {
    const logo = await loadImageAsDataUrl(measureLogo);
    pdf.addImage(logo, "PNG", w / 2 - 40, 80, 80, 40, undefined, "FAST");
  } catch {
    /* ignore */
  }

  // Title
  pdf.setTextColor(NAVY);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(36);
  pdf.text("Certificate of Completion", w / 2, 160, { align: "center" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(13);
  pdf.setTextColor(80);
  pdf.text("Facilitator Training Academy  |  WeMeasure", w / 2, 184, { align: "center" });

  // Presented to
  pdf.setFontSize(14);
  pdf.setTextColor(100);
  pdf.text("This certifies that", w / 2, 230, { align: "center" });

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(34);
  pdf.setTextColor(NAVY);
  pdf.text(p.learnerName, w / 2, 274, { align: "center" });

  // Underline
  pdf.setDrawColor(ORANGE);
  pdf.setLineWidth(1.2);
  pdf.line(w / 2 - 200, 286, w / 2 + 200, 286);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(14);
  pdf.setTextColor(80);
  pdf.text(
    "has successfully completed all lessons and assessments for",
    w / 2,
    314,
    { align: "center" },
  );

  // Level title
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.setTextColor(NAVY);
  pdf.text(`Level ${p.levelNumber}: ${p.levelTitle}`, w / 2, 348, { align: "center" });

  // Score
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(13);
  pdf.setTextColor(80);
  pdf.text(
    `with an assessment score of ${Math.round(p.score * 100)}%`,
    w / 2,
    374,
    { align: "center" },
  );

  // Footer: date + verification
  const dateStr = p.awardedAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  pdf.setDrawColor(NAVY);
  pdf.setLineWidth(0.6);
  pdf.line(120, h - 110, 320, h - 110);
  pdf.line(w - 320, h - 110, w - 120, h - 110);

  pdf.setFontSize(11);
  pdf.setTextColor(NAVY);
  pdf.setFont("helvetica", "bold");
  pdf.text("Date Awarded", 220, h - 92, { align: "center" });
  pdf.text("Verification ID", w - 220, h - 92, { align: "center" });

  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(60);
  pdf.text(dateStr, 220, h - 76, { align: "center" });
  pdf.text(p.verificationCode, w - 220, h - 76, { align: "center" });

  pdf.setFontSize(9);
  pdf.setTextColor(120);
  pdf.text(
    "Issued by MEASURE  |  Facilitator Training Academy  |  wemeasure.ai",
    w / 2,
    h - 50,
    { align: "center" },
  );

  pdf.save(`Certificate_Level_${p.levelNumber}_${p.learnerName.replace(/\s+/g, "_")}.pdf`);
}
