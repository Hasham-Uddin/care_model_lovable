import styles from "./PdfCommunityAssessmentPage.module.css";

export interface AssessmentCard {
  label: string;
  text: string;
  icon: "community" | "population" | "insights" | "history";
}

export interface PdfCommunityAssessmentPageProps {
  pageNumber: number;
  cards: AssessmentCard[];
  footerDate: string;
  insightHighlight?: string;
}

function IconCommunity() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.iconSvg}>
      <path
        d="M3 21V9l9-6 9 6v12H3zm2-2h14v-9l-7-4.7L5 10v9zm4-2h2v2H9v-2zm4 0h2v2h-2v-2z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconPopulation() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.iconSvg}>
      <path
        d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconInsights() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.iconSvg}>
      <path
        d="M5 20V10h3v10H5zm5.5 0V4h3v16h-3zm5.5 0v-7h3v7h-3z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconHistory() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.iconSvg}>
      <path
        d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"
        fill="currentColor"
      />
    </svg>
  );
}

const ICON_MAP = {
  community: IconCommunity,
  population: IconPopulation,
  insights: IconInsights,
  history: IconHistory,
} as const;

const PILL_LABELS: Record<AssessmentCard["icon"], string> = {
  community: "Community",
  population: "Population",
  insights: "Insights",
  history: "History",
};

function AssessmentIcon({ icon }: { icon: AssessmentCard["icon"] }) {
  const Icon = ICON_MAP[icon];
  return <Icon />;
}

export function PdfCommunityAssessmentPage({
  pageNumber,
  cards,
  footerDate,
  insightHighlight,
}: PdfCommunityAssessmentPageProps) {
  const visibleCards = cards.filter((card) => card.text.trim());

  return (
    <div className={styles.page} data-pdf-community-assessment-page>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Community Context & Assessment</h1>
        <span className={styles.pageNumber}>PAGE | {pageNumber}</span>
      </header>

      <main className={styles.content}>
        <div className={styles.pageBody}>
          <div className={styles.phaseStrip}>
            <div className={styles.iconPills} aria-hidden="true">
              {(["community", "population", "insights", "history"] as const).map((key) => (
                <div key={key} className={styles.iconPill}>
                  <div className={`${styles.pillIcon} ${styles[`pillIcon_${key}`]}`}>
                    <AssessmentIcon icon={key} />
                  </div>
                  <span className={styles.pillLabel}>{PILL_LABELS[key]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.cardGrid}>
            {visibleCards.map((card) => (
              <section key={card.label} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={`${styles.cardIcon} ${styles[`cardIcon_${card.icon}`]}`}>
                    <AssessmentIcon icon={card.icon} />
                  </div>
                  <h2 className={styles.cardLabel}>{card.label}</h2>
                </div>
                <p className={styles.cardText}>{card.text}</p>
              </section>
            ))}
          </div>

          {insightHighlight?.trim() ? (
            <div className={styles.insightBand}>
              <p className={styles.insightLabel}>Phase 1 Synthesis</p>
              <p className={styles.insightText}>{insightHighlight}</p>
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
