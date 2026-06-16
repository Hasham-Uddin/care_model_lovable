import { createRoot } from "react-dom/client";
import html2canvas from "html2canvas";
import { PdfCoverPage, type PdfCoverPageProps } from "@/components/pdf/pages/PdfCoverPage";

type CoverDateInput = { date?: string };

const LETTER_WIDTH_PX = 816;
const LETTER_HEIGHT_PX = 1056;
const MONTserrat_URL =
  "https://fonts.googleapis.com/css2?family=Montserrat:wght@200;300;400;500;600;700;800;900&display=swap";

export function formatCoverDate(cover?: CoverDateInput): string {
  if (cover?.date?.trim()) return cover.date.trim().toUpperCase();
  return new Date()
    .toLocaleDateString("en-US", { month: "long", year: "numeric" })
    .toUpperCase();
}

async function ensureMontserratLoaded(): Promise<void> {
  if (!document.querySelector('link[data-pdf-cover-font="montserrat"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = MONTserrat_URL;
    link.setAttribute("data-pdf-cover-font", "montserrat");
    document.head.appendChild(link);
  }

  await new Promise<void>((resolve) => {
    const existing = document.querySelector('link[data-pdf-cover-font="montserrat"]');
    if (existing && (existing as HTMLLinkElement).sheet) resolve();
    else setTimeout(() => resolve(), 150);
  });

  await document.fonts.ready;
}

async function waitForImagesReady(container: HTMLElement, timeoutMs = 5000): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const images = Array.from(container.querySelectorAll("img"));
    if (images.length === 0) return;

    const allReady = images.every((img) => img.complete && (img as HTMLImageElement).naturalWidth > 0);
    if (allReady) return;

    await new Promise((r) => setTimeout(r, 100));
  }
}

export async function renderPdfCoverPageToDataUrl(
  props: PdfCoverPageProps
): Promise<string> {
  await ensureMontserratLoaded();

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
    root.render(<PdfCoverPage {...props} />);

    // React render + CSS apply + image layout
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    await document.fonts.ready;

    await waitForImagesReady(container);

    const pageEl =
      container.querySelector<HTMLElement>("[data-pdf-cover-page]") ?? container;

    const canvas = await html2canvas(pageEl, {
      scale: 2,
      useCORS: false,
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

