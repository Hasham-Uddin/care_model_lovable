import styles from "./PdfStakeholderAnalysisPage.module.css";

export interface StakeholderTableRow {
  col1: string;
  col2: string;
  col3: string;
}

export interface PdfStakeholderAnalysisPageProps {
  pageNumber: number;
  paragraphs: string[];
  tableTitle?: string;
  tableRows: StakeholderTableRow[];
}

export function PdfStakeholderAnalysisPage({
  pageNumber,
  paragraphs,
  tableTitle = "Community Stakeholders",
  tableRows,
}: PdfStakeholderAnalysisPageProps) {
  return (
    <div className={styles.page} data-pdf-stakeholder-analysis-page>
      <header className={styles.topSection}>
        <span className={styles.pageNumber}>PAGE | {pageNumber}</span>
        <div className={styles.topLine} aria-hidden="true" />
      </header>

      <main className={styles.mainContent}>
        <h1 className={styles.pageHeading}>Stakeholder Analysis</h1>
        <h2 className={styles.subheading}>Engagement and Strategy</h2>

        {paragraphs.length > 0 && (
          <div className={styles.engagementText}>
            {paragraphs.map((paragraph, index) => (
              <p key={index} className={styles.bodyText}>
                {paragraph}
              </p>
            ))}
          </div>
        )}

        {tableRows.length > 0 && (
          <table className={styles.stakeholderTable}>
            <thead>
              <tr className={styles.rowYellow}>
                <th colSpan={3}>{tableTitle}</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, index) => (
                <tr
                  key={index}
                  className={index % 2 === 0 ? styles.rowWhite : styles.rowYellow}
                >
                  <td>{row.col1}</td>
                  <td>{row.col2}</td>
                  <td>{row.col3}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>

      <footer className={styles.pageFooter}>
        <div className={styles.footerLine} aria-hidden="true" />
      </footer>
    </div>
  );
}
