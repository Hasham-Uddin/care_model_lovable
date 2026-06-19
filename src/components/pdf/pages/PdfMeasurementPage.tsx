import styles from "./PdfMeasurementPage.module.css";

export interface MeasurementRow {
  metric: string;
  description: string;
  indicator: string;
  target: string;
  method: string;
  frequency: string;
  rank: number;
}

export interface PdfMeasurementPageProps {
  pageNumber: number;
  footerDate: string;
  subtitle?: string;
  approachIntro: string;
  metrics: MeasurementRow[];
}

export function PdfMeasurementPage({
  pageNumber,
  footerDate,
  subtitle = "TRACKING WHAT MATTERS",
  approachIntro,
  metrics,
}: PdfMeasurementPageProps) {
  const visibleMetrics = metrics.filter((row) => row.metric.trim() || row.description.trim());

  return (
    <div className={styles.page} data-pdf-measurement-page>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Measurement & Success Indicators</h1>
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

          {visibleMetrics.length > 0 ? (
            <div className={styles.tableWrap}>
              <table className={styles.metricsTable}>
                <thead>
                  <tr>
                    <th className={styles.colMetric}>Metric</th>
                    <th>Indicator</th>
                    <th>Target</th>
                    <th>Method</th>
                    <th>Frequency</th>
                    <th className={styles.colRank}>Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleMetrics.map((row, index) => (
                    <tr
                      key={`${row.rank}-${row.metric}`}
                      className={index % 2 === 1 ? styles.rowAlt : undefined}
                    >
                      <td className={styles.metricCell}>
                        <span className={styles.metricLabel}>{row.metric}</span>
                        {row.description.trim() ? (
                          <span className={styles.metricDescription}> {row.description}</span>
                        ) : null}
                      </td>
                      <td className={styles.dataCell}>{row.indicator}</td>
                      <td className={styles.dataCell}>{row.target}</td>
                      <td className={styles.dataCell}>{row.method}</td>
                      <td className={styles.dataCell}>{row.frequency}</td>
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
