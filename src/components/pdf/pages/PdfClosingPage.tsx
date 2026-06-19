import styles from "./PdfClosingPage.module.css";

/** Replace public/images/closing.png — recommended size 1856 × 576 px (see component CSS). */
const closingImage = "/images/closing.png";

export interface ClosingLink {
  label: string;
  detail: string;
}

export interface PdfClosingPageProps {
  pageNumber: number;
  footerDate: string;
  thankYouText: string;
  livingDocumentText: string;
  links: ClosingLink[];
  tagline?: string;
}

export function PdfClosingPage({
  pageNumber,
  footerDate,
  thankYouText,
  livingDocumentText,
  links,
  tagline = "Credit. Consent. Compensation.",
}: PdfClosingPageProps) {
  const visibleLinks = links.filter((link) => link.label.trim() || link.detail.trim());

  return (
    <div className={styles.page} data-pdf-closing-page>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Closing & Contact</h1>
        <span className={styles.pageNumber}>PAGE | {pageNumber}</span>
      </header>

      <main className={styles.content}>
        <div className={styles.pageBody}>
          <div
            className={styles.imageBanner}
            style={{ backgroundImage: `url(${closingImage})` }}
            role="img"
            aria-label="Diverse professionals collaborating in a community health workspace"
          />

          <div className={styles.messageBlock}>
            {thankYouText.trim() ? (
              <p className={styles.thankYouText}>{thankYouText}</p>
            ) : null}
            {livingDocumentText.trim() ? (
              <p className={styles.livingDocumentText}>{livingDocumentText}</p>
            ) : null}
          </div>

          {visibleLinks.length > 0 ? (
            <section className={styles.connectSection} aria-label="Stay connected">
              <p className={styles.connectLabel}>Stay Connected</p>
              <div className={styles.connectGrid}>
                {visibleLinks.map((link) => (
                  <div key={link.label} className={styles.connectCard}>
                    <p className={styles.connectCardLabel}>{link.label}</p>
                    <p className={styles.connectCardDetail}>{link.detail}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {tagline.trim() ? (
            <div className={styles.taglineBand}>
              <p className={styles.taglineText}>{tagline}</p>
            </div>
          ) : null}
        </div>

        <footer className={styles.pageFooter}>
          <div className={styles.footerLine} aria-hidden="true" />
          <p className={styles.footerDate}>{footerDate}</p>
        </footer>
      </main>
    </div>
  );
}
