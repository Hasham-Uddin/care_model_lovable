import styles from "./PdfCoverPage.module.css";
import defaultLogo from "@/assets/pdf/cover/logo.png";
import defaultBackground from "@/assets/pdf/cover/background.jpg";

export interface PdfCoverPageProps {
  projectName: string;
  date: string;
  orgLogoUrl?: string;
  coverPhotoUrl?: string;
  preparedBy?: string;
}

export function PdfCoverPage({
  projectName,
  date,
  orgLogoUrl,
  coverPhotoUrl,
  preparedBy = "MEASURE",
}: PdfCoverPageProps) {
  const logoSrc = orgLogoUrl || defaultLogo;
  const photoSrc = coverPhotoUrl || defaultBackground;

  return (
    <div className={styles.page} data-pdf-cover-page>
      <header className={styles.topBar}>
        <div className={styles.logoWrap}>
          <img src={logoSrc} alt="" className={styles.logo} />
        </div>
      </header>

      <main className={styles.hero}>
        <img className={styles.heroBgImg} src={photoSrc} alt="" />

        <div className={styles.contentBox}>
          <h1 className={styles.title}>
            {projectName.toUpperCase()}
            <br />
            COMMUNITY MOBILIZATION
            <br />
            GUIDE
          </h1>
          <p className={styles.preparedBy}>PREPARED BY</p>
          <p className={styles.organization}>{preparedBy.toUpperCase()}</p>
          <p className={styles.website}>wemeasure.org</p>
        </div>
      </main>

      <footer className={styles.bottomBar}>
        <div className={styles.footerText}>
          <span className={styles.footerDate}>{date}</span>
          <span className={styles.footerLabel}>CARE MODEL</span>
        </div>
      </footer>
    </div>
  );
}

