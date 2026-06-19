import styles from "./PdfExecutiveSummaryPage.module.css";

export interface PdfExecutiveSummaryPageProps {
  pageTitle?: string;
  pageNumber: number;
  paragraphs: string[];
  showSignature?: boolean;
  signatureName?: string;
  signatureTitle?: string;
  profilePhotoUrl?: string;
  footerDate: string;
}

export function PdfExecutiveSummaryPage({
  pageTitle = "Executive Summary",
  pageNumber,
  paragraphs,
  showSignature = true,
  signatureName,
  signatureTitle,
  profilePhotoUrl,
  footerDate,
}: PdfExecutiveSummaryPageProps) {
  const showSignatureBlock = showSignature && Boolean(signatureName?.trim());
  const longTitle = pageTitle.length > 22;

  return (
    <div className={styles.page} data-pdf-executive-summary-page>
      <header className={styles.pageHeader}>
        <h1 className={`${styles.pageTitle} ${longTitle ? styles.pageTitleLong : ""}`}>
          {pageTitle}
        </h1>
        <span className={styles.pageNumber}>PAGE | {pageNumber}</span>
      </header>

      <main className={styles.content}>
        {paragraphs.map((paragraph, index) => (
          <p key={index} className={styles.bodyText}>
            {paragraph}
          </p>
        ))}

        <section className={styles.bottomSection}>
          {showSignatureBlock && (
            <div className={styles.signatureBlock}>
              <div>
                <p className={styles.signatureName}>{signatureName}</p>
                {signatureTitle?.trim() ? (
                  <p className={styles.signatureTitle}>{signatureTitle}</p>
                ) : null}
              </div>
              {profilePhotoUrl ? (
                <img
                  src={profilePhotoUrl}
                  alt=""
                  className={styles.profilePhoto}
                />
              ) : null}
            </div>
          )}

          <footer className={styles.pageFooter}>
            <div className={styles.footerLine} aria-hidden="true" />
            <p className={styles.footerDate}>{footerDate}</p>
          </footer>
        </section>
      </main>
    </div>
  );
}
