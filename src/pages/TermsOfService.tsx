import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Last Updated: April 9, 2026 &nbsp;|&nbsp; Effective Date: April 9, 2026
        </p>

        <div className="prose prose-sm max-w-none text-foreground space-y-8">
          {/* 1 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using the MEASURE CARE Model Platform ("Platform"), operated by MEASURE ("Company," "we," "our," or "us"), you ("User," "you," or "your") agree to be bound by these Terms of Service ("Terms"). If you do not agree to all of these Terms, you must not access or use the Platform. Your continued use of the Platform after any modifications to these Terms constitutes acceptance of those changes.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">2. Eligibility</h2>
            <p className="text-muted-foreground leading-relaxed">
              You must be at least 18 years of age or the age of majority in your jurisdiction to use this Platform. By using the Platform, you represent and warrant that you meet this requirement. If you are using the Platform on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">3. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Platform provides a community-based AI facilitation tool built on the CARE Model framework. It includes guided session workflows, AI co-facilitation features, Theory of Interrogative Reasoning tools, data contribution capabilities, survey instruments, and project management functionalities designed for community organizations and research facilitators.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">4. User Accounts &amp; Registration</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>You must provide accurate, current, and complete registration information.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You are responsible for all activities that occur under your account.</li>
              <li>You must notify us immediately of any unauthorized use of your account.</li>
              <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">5. Acceptable Use Policy</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">You agree not to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Use the Platform for any unlawful purpose or in violation of any applicable local, state, national, or international law.</li>
              <li>Input personally identifiable information (PII), protected health information (PHI), or other sensitive personal data into AI-powered features unless explicitly authorized by the Platform's data governance policies.</li>
              <li>Attempt to reverse-engineer, decompile, disassemble, or otherwise attempt to derive source code from the Platform.</li>
              <li>Interfere with or disrupt the integrity or performance of the Platform.</li>
              <li>Use the Platform to harass, abuse, defame, threaten, or intimidate any person.</li>
              <li>Upload or transmit viruses, malware, or any other malicious code.</li>
              <li>Circumvent any access control, authentication, or security mechanisms.</li>
              <li>Misrepresent AI-generated outputs as solely human-authored work without disclosure.</li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">6. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              <strong className="text-foreground">Platform IP:</strong> All content, features, functionality, software, designs, and trademarks of the Platform are owned by MEASURE and are protected by United States and international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              <strong className="text-foreground">User Content:</strong> You retain ownership of any content you submit to the Platform ("User Content"). By submitting User Content, you grant MEASURE a non-exclusive, worldwide, royalty-free license to use, store, and process that content solely for the purpose of providing and improving the Platform services.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Community Data Contributions:</strong> Data contributed through the opt-in data donation program is governed by the separate Data Contribution Agreement and CARE Model AI Tool Policy, which you must acknowledge during project creation.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">7. AI-Generated Content Disclaimer</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Platform incorporates artificial intelligence features that generate suggestions, analysis, and content. AI-generated outputs are provided for informational and facilitation purposes only and do not constitute professional, legal, medical, or financial advice. All AI outputs require human review and oversight before being acted upon. MEASURE does not guarantee the accuracy, completeness, or fitness for any particular purpose of AI-generated content.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">8. Data Governance &amp; Community Stewardship</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Platform adheres to the CARE Model's principles of community data sovereignty. Data contribution is opt-in and revocable. Interrogation data used to build anti-bias datasets is anonymized prior to any aggregation. Community organizations retain governance rights over contributed data as described in the Data Stewardship Statement. For full details on data handling, please review our <a href="/privacy-policy" className="text-primary underline hover:text-primary/80">Privacy Policy</a>.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">9. Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Platform may integrate with or link to third-party services, including AI model providers. MEASURE is not responsible for the content, privacy practices, or availability of third-party services. Your use of third-party services is subject to their respective terms and policies.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">10. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL MEASURE, ITS DIRECTORS, OFFICERS, EMPLOYEES, AGENTS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR IN CONNECTION WITH YOUR ACCESS TO OR USE OF (OR INABILITY TO ACCESS OR USE) THE PLATFORM. MEASURE'S TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNTS PAID BY YOU, IF ANY, TO MEASURE DURING THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">11. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground leading-relaxed">
              THE PLATFORM IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. MEASURE DOES NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">12. Indemnification</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree to indemnify, defend, and hold harmless MEASURE and its officers, directors, employees, agents, and affiliates from and against any and all claims, damages, obligations, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising from: (a) your use of the Platform; (b) your violation of these Terms; (c) your violation of any third-party right, including any intellectual property or privacy right; or (d) any User Content you submit.
            </p>
          </section>

          {/* 13 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">13. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may terminate or suspend your access to the Platform immediately, without prior notice or liability, for any reason, including if you breach these Terms. Upon termination, your right to use the Platform will immediately cease. You may request deletion of your account and associated personal data by contacting us. Provisions that by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
            </p>
          </section>

          {/* 14 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">14. Governing Law &amp; Dispute Resolution</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              These Terms shall be governed by and construed in accordance with the laws of the State of Texas, without regard to its conflict of law provisions.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Any dispute arising out of or relating to these Terms or the Platform shall first be resolved through good-faith negotiation. If the dispute is not resolved within thirty (30) days, either party may submit the dispute to binding arbitration in accordance with the rules of the American Arbitration Association, to be conducted in the State of Texas.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              You agree that any arbitration shall be conducted on an individual basis and not as a class, consolidated, or representative action. You waive any right to participate in a class action lawsuit or class-wide arbitration.
            </p>
          </section>

          {/* 15 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">15. Modifications to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these Terms at any time. We will provide notice of material changes by posting updated Terms on the Platform and updating the "Last Updated" date. Your continued use of the Platform after such changes constitutes acceptance of the revised Terms. It is your responsibility to review these Terms periodically.
            </p>
          </section>

          {/* 16 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">16. Severability</h2>
            <p className="text-muted-foreground leading-relaxed">
              If any provision of these Terms is held to be unenforceable or invalid, such provision will be modified to the minimum extent necessary to make it enforceable, and the remaining provisions will continue in full force and effect.
            </p>
          </section>

          {/* 17 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">17. Entire Agreement</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms, together with the Privacy Policy, AI Acceptable Use Policy, and CARE Model AI Tool Policy &amp; Data Stewardship Statement, constitute the entire agreement between you and MEASURE regarding the use of the Platform.
            </p>
          </section>

          {/* 18 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">18. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms, please contact us at:
            </p>
            <div className="mt-3 p-4 bg-muted rounded-lg border border-border text-muted-foreground">
              <p className="font-medium text-foreground">MEASURE</p>
              <p>Email: legal@wemeasure.org</p>
              <p>Website: <a href="https://wemeasure.org" className="text-primary underline hover:text-primary/80" target="_blank" rel="noopener noreferrer">wemeasure.org</a></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
