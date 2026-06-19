import styles from "./PdfProblemFramingPage.module.css";

/** Served from public/images — update that file only; no copy to src/assets needed. */
const problemFramingImage = "/images/problem-framing.png";

export interface PdfProblemFramingPageProps {
  pageNumber: number;
  footerDate: string;
  problemStatement: string;
  rootCauses: string;
  systemicDrivers: string;
  whyNow: string;
}

interface CausalLane {
  step: string;
  label: string;
  text: string;
}

export function PdfProblemFramingPage({
  pageNumber,
  footerDate,
  problemStatement,
  rootCauses,
  systemicDrivers,
  whyNow,
}: PdfProblemFramingPageProps) {
  const lanes: CausalLane[] = [
    { step: "01", label: "Root Causes", text: rootCauses },
    { step: "02", label: "Systemic Drivers", text: systemicDrivers },
    { step: "03", label: "Why Now", text: whyNow },
  ].filter((lane) => lane.text.trim());

  return (
    <div className={styles.page} data-pdf-problem-framing-page>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Root Cause & Problem Framing</h1>
        <span className={styles.pageNumber}>PAGE | {pageNumber}</span>
      </header>

      <main className={styles.content}>
        <div
          className={styles.imageBanner}
          style={{ backgroundImage: `url(${problemFramingImage})` }}
          role="img"
          aria-label=""
        />

        {problemStatement.trim() ? (
          <blockquote className={styles.problemQuote}>
            <span className={styles.quoteMark} aria-hidden="true">
              “
            </span>
            <p className={styles.quoteText}>{problemStatement}</p>
            <span className={styles.quoteLabel}>The Problem</span>
          </blockquote>
        ) : null}

        {lanes.length > 0 ? (
          <div className={styles.causalStack}>
            {lanes.map((lane, index) => (
              <div key={lane.label} className={styles.causalRow}>
                <div className={styles.causalRail}>
                  <span className={styles.causalStep}>{lane.step}</span>
                  {index < lanes.length - 1 ? (
                    <span className={styles.causalConnector} aria-hidden="true" />
                  ) : null}
                </div>
                <div className={styles.causalBody}>
                  <h2 className={styles.causalLabel}>{lane.label}</h2>
                  <p className={styles.causalText}>{lane.text}</p>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <footer className={styles.pageFooter}>
          <div className={styles.footerLine} aria-hidden="true" />
          <p className={styles.footerDate}>{footerDate}</p>
        </footer>
      </main>
    </div>
  );
}
