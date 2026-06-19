import styles from "./PdfStakeholderAnalysisPage.module.css";

export type StakeholderAlignment = "ally" | "neutral" | "mixed" | "opposition";

export interface StakeholderCard {
  name: string;
  role: string;
  engagement: string;
  alignment?: StakeholderAlignment;
}

export interface PdfStakeholderAnalysisPageProps {
  pageNumber: number;
  footerDate: string;
  engagementIntro: string;
  stakeholders: StakeholderCard[];
  engagementHighlight?: string;
}

function IconPartners() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.iconSvg}>
      <path
        d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconInstitutions() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.iconSvg}>
      <path
        d="M12 7V3H2v18h20V7H12zm-2 12H4v-2h6v2zm0-4H4v-2h6v2zm0-4H4V9h6v2zm8 8h-6v-2h6v2zm0-4h-6v-2h6v2z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconCommunity() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.iconSvg}>
      <path
        d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconInfluence() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.iconSvg}>
      <path
        d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"
        fill="currentColor"
      />
    </svg>
  );
}

const PILL_ICONS = {
  partners: IconPartners,
  institutions: IconInstitutions,
  community: IconCommunity,
  influence: IconInfluence,
} as const;

const PILL_LABELS: Record<keyof typeof PILL_ICONS, string> = {
  partners: "Partners",
  institutions: "Institutions",
  community: "Community",
  influence: "Influence",
};

const ALIGNMENT_LABELS: Record<StakeholderAlignment, string> = {
  ally: "Ally",
  neutral: "Neutral",
  mixed: "Mixed",
  opposition: "Opposition",
};

function StakeholderPillIcon({ type }: { type: keyof typeof PILL_ICONS }) {
  const Icon = PILL_ICONS[type];
  return <Icon />;
}

export function PdfStakeholderAnalysisPage({
  pageNumber,
  footerDate,
  engagementIntro,
  stakeholders,
  engagementHighlight,
}: PdfStakeholderAnalysisPageProps) {
  const visibleStakeholders = stakeholders.filter((item) => item.name.trim());

  return (
    <div className={styles.page} data-pdf-stakeholder-analysis-page>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Stakeholder Analysis</h1>
        <span className={styles.pageNumber}>PAGE | {pageNumber}</span>
      </header>

      <main className={styles.content}>
        <div className={styles.pageBody}>
          <div className={styles.iconStrip}>
            <div className={styles.iconPills} aria-hidden="true">
              {(Object.keys(PILL_ICONS) as Array<keyof typeof PILL_ICONS>).map((key) => (
                <div key={key} className={styles.iconPill}>
                  <div className={`${styles.pillIcon} ${styles[`pillIcon_${key}`]}`}>
                    <StakeholderPillIcon type={key} />
                  </div>
                  <span className={styles.pillLabel}>{PILL_LABELS[key]}</span>
                </div>
              ))}
            </div>
          </div>

          {engagementIntro.trim() ? (
            <div className={styles.introCallout}>
              <p className={styles.introLabel}>Engagement Strategy</p>
              <p className={styles.introText}>{engagementIntro}</p>
            </div>
          ) : null}

          <div className={styles.stakeholderGrid}>
            {visibleStakeholders.map((stakeholder) => (
              <article key={stakeholder.name} className={styles.stakeholderCard}>
                <div className={styles.cardTop}>
                  {stakeholder.alignment ? (
                    <span
                      className={`${styles.alignmentBadge} ${styles[`alignment_${stakeholder.alignment}`]}`}
                    >
                      {ALIGNMENT_LABELS[stakeholder.alignment]}
                    </span>
                  ) : null}
                  <h2 className={styles.stakeholderName}>{stakeholder.name}</h2>
                </div>
                {stakeholder.role.trim() ? (
                  <p className={styles.stakeholderRole}>{stakeholder.role}</p>
                ) : null}
                {stakeholder.engagement.trim() ? (
                  <p className={styles.stakeholderEngagement}>{stakeholder.engagement}</p>
                ) : null}
              </article>
            ))}
          </div>

          {engagementHighlight?.trim() ? (
            <div className={styles.insightBand}>
              <p className={styles.insightLabel}>Engagement Priority</p>
              <p className={styles.insightText}>{engagementHighlight}</p>
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
