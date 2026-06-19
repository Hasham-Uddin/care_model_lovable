import styles from "./PdfImplementationRoadmapPage.module.css";

/** Update public/images/implementation-roadmap.png to customize this banner. */
const implementationRoadmapImage = "/images/implementation-roadmap.png";

export interface PdfImplementationRoadmapPageProps {
  pageNumber: number;
  footerDate: string;
  roadmapOverview: string;
  communityAssets: string;
  timelineRoles: string;
  dataAccountability: string;
}

interface RoadmapLane {
  step: string;
  label: string;
  text: string;
}

export function PdfImplementationRoadmapPage({
  pageNumber,
  footerDate,
  roadmapOverview,
  communityAssets,
  timelineRoles,
  dataAccountability,
}: PdfImplementationRoadmapPageProps) {
  const lanes: RoadmapLane[] = [
    { step: "01", label: "Community Assets", text: communityAssets },
    { step: "02", label: "Timeline & Roles", text: timelineRoles },
    { step: "03", label: "Data & Accountability", text: dataAccountability },
  ].filter((lane) => lane.text.trim());

  return (
    <div className={styles.page} data-pdf-implementation-roadmap-page>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Implementation Roadmap</h1>
        <span className={styles.pageNumber}>PAGE | {pageNumber}</span>
      </header>

      <main className={styles.content}>
        <div
          className={styles.imageBanner}
          style={{ backgroundImage: `url(${implementationRoadmapImage})` }}
          role="img"
          aria-label=""
        />

        {roadmapOverview.trim() ? (
          <blockquote className={styles.roadmapQuote}>
            <span className={styles.quoteMark} aria-hidden="true">
              “
            </span>
            <p className={styles.quoteText}>{roadmapOverview}</p>
            <span className={styles.quoteLabel}>The Roadmap</span>
          </blockquote>
        ) : null}

        {lanes.length > 0 ? (
          <div className={styles.roadmapStack}>
            {lanes.map((lane, index) => (
              <div key={lane.label} className={styles.roadmapRow}>
                <div className={styles.roadmapRail}>
                  <span className={styles.roadmapStep}>{lane.step}</span>
                  {index < lanes.length - 1 ? (
                    <span className={styles.roadmapConnector} aria-hidden="true" />
                  ) : null}
                </div>
                <div className={styles.roadmapBody}>
                  <h2 className={styles.roadmapLabel}>{lane.label}</h2>
                  <p className={styles.roadmapText}>{lane.text}</p>
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
