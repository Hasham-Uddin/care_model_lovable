import { createRoot } from "react-dom/client";
import html2canvas from "html2canvas";
import {
  PdfStakeholderAnalysisPage,
  type PdfStakeholderAnalysisPageProps,
} from "@/components/pdf/pages/PdfStakeholderAnalysisPage";

const LETTER_WIDTH_PX = 816;
const LETTER_HEIGHT_PX = 1056;
const FONT_URL =
  "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap";

async function ensureFontsLoaded(): Promise<void> {
  if (!document.querySelector('link[data-pdf-stakeholder-font="montserrat"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_URL;
    link.setAttribute("data-pdf-stakeholder-font", "montserrat");
    document.head.appendChild(link);
  }

  await new Promise<void>((resolve) => {
    const existing = document.querySelector('link[data-pdf-stakeholder-font="montserrat"]');
    if (existing && (existing as HTMLLinkElement).sheet) resolve();
    else setTimeout(() => resolve(), 150);
  });

  await document.fonts.ready;
}

export async function renderPdfStakeholderAnalysisPageToDataUrl(
  props: PdfStakeholderAnalysisPageProps
): Promise<string> {
  await ensureFontsLoaded();

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0";
  container.style.width = `${LETTER_WIDTH_PX}px`;
  container.style.height = `${LETTER_HEIGHT_PX}px`;
  container.style.overflow = "hidden";
  container.style.pointerEvents = "none";
  document.body.appendChild(container);

  const root = createRoot(container);
  try {
    root.render(<PdfStakeholderAnalysisPage {...props} />);

    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    await document.fonts.ready;

    const pageEl =
      container.querySelector<HTMLElement>("[data-pdf-stakeholder-analysis-page]") ?? container;

    const canvas = await html2canvas(pageEl, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: LETTER_WIDTH_PX,
      height: LETTER_HEIGHT_PX,
      windowWidth: LETTER_WIDTH_PX,
      windowHeight: LETTER_HEIGHT_PX,
    });

    return canvas.toDataURL("image/png");
  } finally {
    try {
      root.unmount();
    } catch {
      // ignore
    }
    if (container.parentElement) document.body.removeChild(container);
  }
}
