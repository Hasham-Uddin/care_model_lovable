import { createRoot } from "react-dom/client";
import html2canvas from "html2canvas";
import {
  PdfClosingPage,
  type PdfClosingPageProps,
} from "@/components/pdf/pages/PdfClosingPage";

const PRIMARY_IMAGE = "/images/closing.png";
const FALLBACK_IMAGE = "/images/mission-vision.png";

const LETTER_WIDTH_PX = 816;
const LETTER_HEIGHT_PX = 1056;
const FONT_URL =
  "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap";

async function ensureFontsLoaded(): Promise<void> {
  if (!document.querySelector('link[data-pdf-closing-font="montserrat"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_URL;
    link.setAttribute("data-pdf-closing-font", "montserrat");
    document.head.appendChild(link);
  }

  await new Promise<void>((resolve) => {
    const existing = document.querySelector('link[data-pdf-closing-font="montserrat"]');
    if (existing && (existing as HTMLLinkElement).sheet) resolve();
    else setTimeout(() => resolve(), 150);
  });

  await document.fonts.ready;
}

async function preloadImage(src: string): Promise<boolean> {
  try {
    await new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
    return true;
  } catch {
    return false;
  }
}

export async function renderPdfClosingPageToDataUrl(
  props: PdfClosingPageProps
): Promise<string> {
  await ensureFontsLoaded();
  const hasPrimary = await preloadImage(PRIMARY_IMAGE);
  if (!hasPrimary) await preloadImage(FALLBACK_IMAGE);

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
    root.render(<PdfClosingPage {...props} />);

    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    await document.fonts.ready;

    const pageEl = container.querySelector<HTMLElement>("[data-pdf-closing-page]") ?? container;

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
