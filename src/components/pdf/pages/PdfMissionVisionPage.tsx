import styles from "./PdfMissionVisionPage.module.css";
import missionVisionImage from "@/assets/pdf/mission-vision.png";

export interface PdfMissionVisionPageProps {
  pageNumber: number;
  organizationName?: string;
  statedMission?: string;
  vision?: string;
  strategicAlignment?: string;
  orgLogoUrl?: string;
  footerDate: string;
}

function ContentBlock({
  label,
  text,
  variant = "body",
}: {
  label: string;
  text: string;
  variant?: "quote" | "body";
}) {
  if (!text.trim()) return null;

  return (
    <section className={styles.block}>
      <h2 className={styles.blockLabel}>{label}</h2>
      <p className={variant === "quote" ? styles.missionQuote : styles.bodyText}>{text}</p>
    </section>
  );
}

export function PdfMissionVisionPage({
  pageNumber,
  organizationName,
  statedMission,
  vision,
  strategicAlignment,
  orgLogoUrl,
  footerDate,
}: PdfMissionVisionPageProps) {
  return (
    <div className={styles.page} data-pdf-mission-vision-page>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Organization Mission & Vision</h1>
        <span className={styles.pageNumber}>PAGE | {pageNumber}</span>
      </header>

      <main className={styles.content}>
        <div className={styles.pageBody}>
          <div className={styles.blocks}>
            {statedMission?.trim() ? (
              <section className={styles.block}>
                <h2 className={styles.blockLabel}>Our Mission</h2>
                <div className={styles.missionRow}>
                  {orgLogoUrl ? (
                    <img src={orgLogoUrl} alt="" className={styles.orgLogo} />
                  ) : null}
                  <div className={styles.missionQuoteWrap}>
                    {organizationName?.trim() ? (
                      <p className={styles.orgName}>{organizationName}</p>
                    ) : null}
                    <p className={styles.missionQuote}>{statedMission}</p>
                  </div>
                </div>
              </section>
            ) : null}

            <ContentBlock label="Our Vision" text={vision || ""} />
            <ContentBlock label="Strategic Alignment" text={strategicAlignment || ""} />
          </div>

          <div
            className={styles.imageBanner}
            style={{ backgroundImage: `url(${missionVisionImage})` }}
            role="img"
            aria-label=""
          />
        </div>

        <footer className={styles.pageFooter}>
          <div className={styles.footerLine} aria-hidden="true" />
          <p className={styles.footerDate}>{footerDate}</p>
        </footer>
      </main>
    </div>
  );
}
