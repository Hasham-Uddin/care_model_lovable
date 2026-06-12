import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Last Updated: April 9, 2026 &nbsp;|&nbsp; Effective Date: April 9, 2026
        </p>

        <div className="prose prose-sm max-w-none text-foreground space-y-8">
          {/* 1 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              MEASURE ("Company," "we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use the MEASURE CARE Model Platform ("Platform"). This policy is designed to comply with the Texas Data Privacy and Security Act (TDPSA, effective July 1, 2024), applicable federal laws, and industry best practices for AI-enabled platforms.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>

            <h3 className="text-lg font-medium mt-4 mb-2">2.1 Information You Provide Directly</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong className="text-foreground">Account Information:</strong> Full name, email address, and organizational affiliation when you register.</li>
              <li><strong className="text-foreground">Project Data:</strong> Project names, session notes, artifacts, problem statements, community group descriptions, and other content you create within the Platform.</li>
              <li><strong className="text-foreground">Survey Responses:</strong> AI literacy survey answers submitted during facilitation sessions.</li>
              <li><strong className="text-foreground">Interrogation Data:</strong> User prompts, AI model outputs, bias challenge tags, human feedback, and verdict decisions submitted through the Theory of Interrogative Reasoning workflow.</li>
              <li><strong className="text-foreground">Consent Records:</strong> AI policy acknowledgments, data donation preferences, and cookie consent choices.</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">2.2 Information Collected Automatically</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong className="text-foreground">Usage Data:</strong> Pages visited, features used, session duration, and interaction patterns (only when analytics cookies are accepted).</li>
              <li><strong className="text-foreground">Device Information:</strong> Browser type, operating system, device type, and screen resolution.</li>
              <li><strong className="text-foreground">Log Data:</strong> IP address (truncated/anonymized), access timestamps, and error logs for security and performance monitoring.</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">2.3 Information We Do NOT Collect</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Social Security numbers or government-issued identification numbers.</li>
              <li>Financial account or payment card information (payment processing is handled by third-party processors).</li>
              <li>Protected health information (PHI) as defined by HIPAA.</li>
              <li>Biometric data, geolocation data, or data from children under 18.</li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>To provide, maintain, and improve the Platform and its features.</li>
              <li>To authenticate your identity and manage your account.</li>
              <li>To facilitate AI co-facilitation sessions and generate session-specific guidance.</li>
              <li>To process and display survey results and project artifacts.</li>
              <li>To create anonymized, aggregated anti-bias training datasets (only with explicit opt-in consent).</li>
              <li>To send transactional communications such as project invitations and session notifications.</li>
              <li>To monitor and enforce compliance with our Terms of Service and AI policies.</li>
              <li>To detect, prevent, and address security incidents and technical issues.</li>
              <li>To comply with legal obligations and respond to lawful requests.</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">4. Legal Bases for Processing</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong className="text-foreground">Contractual Necessity:</strong> Processing required to provide the Platform services you requested.</li>
              <li><strong className="text-foreground">Consent:</strong> Where you have given explicit consent, such as opting in to data donation or analytics cookies.</li>
              <li><strong className="text-foreground">Legitimate Interest:</strong> Platform security, fraud prevention, and service improvement.</li>
              <li><strong className="text-foreground">Legal Obligation:</strong> Compliance with applicable laws and regulations.</li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">5. Data Sharing &amp; Disclosure</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">We do not sell your personal data. We may share information in the following limited circumstances:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong className="text-foreground">Service Providers:</strong> With trusted third-party vendors who assist in operating the Platform (e.g., hosting, email delivery, payment processing), bound by data processing agreements.</li>
              <li><strong className="text-foreground">AI Model Providers:</strong> User prompts may be sent to AI model providers to generate outputs. These transmissions are governed by our AI governance policies and do not include PII unless expressly authorized.</li>
              <li><strong className="text-foreground">Community Data Commons:</strong> Anonymized interrogation data may be included in community-governed anti-bias datasets, only with explicit opt-in consent and subject to revocation rights.</li>
              <li><strong className="text-foreground">Legal Requirements:</strong> When required by law, regulation, court order, or governmental request.</li>
              <li><strong className="text-foreground">Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, with advance notice to affected users.</li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">6. Your Rights Under Texas Law (TDPSA)</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Under the Texas Data Privacy and Security Act, Texas residents have the following rights:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong className="text-foreground">Right to Know:</strong> You may request confirmation of whether we process your personal data and obtain access to that data.</li>
              <li><strong className="text-foreground">Right to Correct:</strong> You may request correction of inaccurate personal data.</li>
              <li><strong className="text-foreground">Right to Delete:</strong> You may request deletion of your personal data, subject to certain exceptions.</li>
              <li><strong className="text-foreground">Right to Data Portability:</strong> You may request a copy of your personal data in a portable, readily usable format.</li>
              <li><strong className="text-foreground">Right to Opt Out:</strong> You may opt out of the processing of your personal data for purposes of targeted advertising, the sale of personal data, or profiling that produces legal or similarly significant effects.</li>
              <li><strong className="text-foreground">Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your privacy rights.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              To exercise these rights, contact us at <a href="mailto:privacy@wemeasure.org" className="text-primary underline hover:text-primary/80">privacy@wemeasure.org</a>. We will respond to verified requests within 45 days. You may appeal a denial by contacting us; if unsatisfied, you may file a complaint with the Texas Attorney General.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">7. Cookies &amp; Tracking Technologies</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">We use the following categories of cookies:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong className="text-foreground">Essential Cookies:</strong> Required for authentication, session management, and core Platform functionality. These cannot be disabled.</li>
              <li><strong className="text-foreground">Analytics Cookies (Optional):</strong> Help us understand how the Platform is used so we can improve the experience. Fully anonymized and never shared with third parties. You can manage your cookie preferences at any time through our cookie consent banner.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              We do not use advertising cookies or tracking pixels. We do not engage in cross-site tracking.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">8. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-standard technical and organizational measures to protect your personal data, including: encryption in transit (TLS/SSL) and at rest; role-based access controls and row-level security policies; regular security audits and vulnerability scanning; secure authentication with email verification; and audit logging of data access and consent events. While we strive to protect your information, no method of electronic transmission or storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">9. Data Retention</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong className="text-foreground">Account Data:</strong> Retained for the duration of your account and for a reasonable period afterward for legal and audit purposes.</li>
              <li><strong className="text-foreground">Project Data:</strong> Retained as long as the associated project exists. Facilitators may delete projects and associated data at any time.</li>
              <li><strong className="text-foreground">Consent Records:</strong> Retained for a minimum of 5 years for legal compliance and audit purposes.</li>
              <li><strong className="text-foreground">Anonymized Data:</strong> Anonymized and aggregated data may be retained indefinitely as it is no longer personal data.</li>
              <li><strong className="text-foreground">Log Data:</strong> System logs are retained for up to 90 days for security monitoring.</li>
            </ul>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">10. AI-Specific Privacy Practices</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>User data is never used to train external AI models without explicit, informed, opt-in consent.</li>
              <li>AI interactions are logged for transparency and audit purposes, with sensitive content sanitized.</li>
              <li>The Platform's AI features are governed by the AI Acceptable Use Policy and CARE Model AI Tool Policy, which must be acknowledged before use.</li>
              <li>AI-generated outputs are clearly labeled and require human review before action.</li>
              <li>Users may opt out of AI-related data processing at any time without losing access to non-AI Platform features.</li>
            </ul>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">11. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Platform is not intended for use by individuals under 18 years of age. We do not knowingly collect personal data from minors. If we learn that we have inadvertently collected personal data from a child under 18, we will take steps to delete that information promptly. If you believe a minor has provided us with personal data, please contact us immediately.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">12. International Data Transfers</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Platform is operated from the United States. If you access the Platform from outside the United States, you acknowledge that your personal data will be transferred to, stored, and processed in the United States, where data protection laws may differ from those of your jurisdiction.
            </p>
          </section>

          {/* 13 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">13. Changes to This Privacy Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on the Platform and updating the "Last Updated" date. For significant changes, we may provide additional notice, such as an email notification or in-app banner. Your continued use of the Platform after such changes constitutes acceptance of the revised policy.
            </p>
          </section>

          {/* 14 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">14. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="mt-3 p-4 bg-muted rounded-lg border border-border text-muted-foreground">
              <p className="font-medium text-foreground">MEASURE — Privacy Team</p>
              <p>Email: <a href="mailto:privacy@wemeasure.org" className="text-primary underline hover:text-primary/80">privacy@wemeasure.org</a></p>
              <p>Website: <a href="https://wemeasure.org" className="text-primary underline hover:text-primary/80" target="_blank" rel="noopener noreferrer">wemeasure.org</a></p>
            </div>
            <p className="text-muted-foreground leading-relaxed mt-3">
              If you are not satisfied with our response, Texas residents may file a complaint with the <strong className="text-foreground">Office of the Texas Attorney General</strong> at <a href="https://www.texasattorneygeneral.gov" className="text-primary underline hover:text-primary/80" target="_blank" rel="noopener noreferrer">texasattorneygeneral.gov</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
