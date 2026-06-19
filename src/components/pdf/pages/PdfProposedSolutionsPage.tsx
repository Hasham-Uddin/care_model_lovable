import styles from "./PdfProposedSolutionsPage.module.css";

export type SolutionRating = "High" | "Medium" | "Low";

export interface SolutionAlignmentRow {
  action: string;
  description: string;
  desirability: SolutionRating;
  equitably: SolutionRating;
  feasibility: SolutionRating;
  sustainability: SolutionRating;
  rank: number;
}

export interface PdfProposedSolutionsPageProps {
  pageNumber: number;
  footerDate: string;
  subtitle?: string;
  approachIntro: string;
  solutions: SolutionAlignmentRow[];
}

export function PdfProposedSolutionsPage({
  pageNumber,
  footerDate,
  subtitle = "COMMUNITY FIRST SOLUTIONS",
  approachIntro,
  solutions,
}: PdfProposedSolutionsPageProps) {
  const visibleSolutions = solutions.filter((row) => row.action.trim() || row.description.trim());

  return (
    <div className={styles.page} data-pdf-proposed-solutions-page>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Proposed Solutions</h1>
        <span className={styles.pageNumber}>PAGE | {pageNumber}</span>
      </header>

      <main className={styles.content}>
        <div className={styles.pageBody}>
          <div className={styles.titleBlock}>
            <div className={styles.titleRule} aria-hidden="true" />
            <p className={styles.subtitle}>{subtitle}</p>
          </div>

          {approachIntro.trim() ? (
            <p className={styles.approachText}>{approachIntro}</p>
          ) : null}

          {visibleSolutions.length > 0 ? (
            <div className={styles.tableWrap}>
              <table className={styles.alignmentTable}>
                <thead>
                  <tr>
                    <th className={styles.colSolution}>Solution</th>
                    <th>Desirability</th>
                    <th>Equitably</th>
                    <th>Feasibility</th>
                    <th>Sustainability</th>
                    <th className={styles.colRank}>Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleSolutions.map((row, index) => (
                    <tr
                      key={`${row.rank}-${row.action}`}
                      className={index % 2 === 1 ? styles.rowAlt : undefined}
                    >
                      <td className={styles.solutionCell}>
                        <span className={styles.solutionAction}>{row.action}</span>
                        {row.description.trim() ? (
                          <span className={styles.solutionDescription}> {row.description}</span>
                        ) : null}
                      </td>
                      <td className={styles.ratingCell}>{row.desirability}</td>
                      <td className={styles.ratingCell}>{row.equitably}</td>
                      <td className={styles.ratingCell}>{row.feasibility}</td>
                      <td className={styles.ratingCell}>{row.sustainability}</td>
                      <td className={styles.rankCell}>{row.rank}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
