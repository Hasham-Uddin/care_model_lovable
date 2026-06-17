import styles from "./PdfExecutiveSummaryPage.module.css";

export interface PdfExecutiveSummaryPageProps {
  pageNumber: number;
  paragraphs: string[];
  signatureName?: string;
  signatureTitle?: string;
  profilePhotoUrl?: string;
  footerDate: string;
}

export function PdfExecutiveSummaryPage({
  pageNumber,
  paragraphs,
  signatureName,
  signatureTitle,
  profilePhotoUrl,
  footerDate,
}: PdfExecutiveSummaryPageProps) {
  const showSignature = Boolean(signatureName?.trim());

  return (
    <div className={styles.page} data-pdf-executive-summary-page>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Executive Summary</h1>
        <span className={styles.pageNumber}>PAGE | {pageNumber}</span>
      </header>

      <main className={styles.content}>
        {paragraphs.map((paragraph, index) => (
          <p key={index} className={styles.bodyText}>
            {paragraph}
          </p>
        ))}

        <section className={styles.bottomSection}>
          {showSignature && (
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
