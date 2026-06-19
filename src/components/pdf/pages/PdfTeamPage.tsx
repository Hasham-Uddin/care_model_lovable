import styles from "./PdfTeamPage.module.css";

export interface TeamRow {
  name: string;
  roleLabel: string;
  email: string;
  rank: number;
}

export interface PdfTeamPageProps {
  pageNumber: number;
  footerDate: string;
  subtitle?: string;
  introText: string;
  teamRows: TeamRow[];
  acknowledgmentText?: string;
}

export function PdfTeamPage({
  pageNumber,
  footerDate,
  subtitle = "THOSE WHO MADE IT POSSIBLE",
  introText,
  teamRows,
  acknowledgmentText,
}: PdfTeamPageProps) {
  const visibleRows = teamRows.filter((row) => row.name.trim() || row.email.trim());

  return (
    <div className={styles.page} data-pdf-team-page>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Team & Acknowledgments</h1>
        <span className={styles.pageNumber}>PAGE | {pageNumber}</span>
      </header>

      <main className={styles.content}>
        <div className={styles.pageBody}>
          <div className={styles.titleBlock}>
            <div className={styles.titleRule} aria-hidden="true" />
            <p className={styles.subtitle}>{subtitle}</p>
          </div>

          {introText.trim() ? <p className={styles.introText}>{introText}</p> : null}

          {visibleRows.length > 0 ? (
            <div className={styles.tableWrap}>
              <table className={styles.teamTable}>
                <thead>
                  <tr>
                    <th className={styles.colName}>Team Member</th>
                    <th className={styles.colRole}>Role</th>
                    <th className={styles.colContact}>Contact</th>
                    <th className={styles.colRank}>#</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row, index) => (
                    <tr
                      key={`${row.rank}-${row.email || row.name}`}
                      className={index % 2 === 1 ? styles.rowAlt : undefined}
                    >
                      <td className={styles.nameCell}>
                        <span className={styles.memberName}>{row.name}</span>
                      </td>
                      <td className={styles.roleCell}>
                        <span
                          className={
                            row.roleLabel === "CARE Team Leader"
                              ? styles.roleBadgeLeader
                              : styles.roleBadgeMember
                          }
                        >
                          {row.roleLabel}
                        </span>
                      </td>
                      <td className={styles.contactCell}>{row.email}</td>
                      <td className={styles.rankCell}>{row.rank}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {acknowledgmentText?.trim() ? (
            <div className={styles.acknowledgmentBand}>
              <p className={styles.acknowledgmentText}>{acknowledgmentText}</p>
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
