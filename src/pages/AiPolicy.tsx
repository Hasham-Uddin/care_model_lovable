import { ArrowLeft, Shield, Eye, Scale, Lock, Users, AlertTriangle, Heart, BookOpen, Leaf, Briefcase, FileText, MessageSquare, Zap, Ban, UserCheck, Globe, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import measureLogo from "@/assets/measure-logo.png";
import { PolicySection, PolicyList, PolicyQuote } from "@/components/policy/PolicySection";
import { PolicyTableOfContents } from "@/components/policy/PolicyTableOfContents";
import { PolicyRolesTable } from "@/components/policy/PolicyRolesTable";

const POLICY_VERSION = "1.0";
const POLICY_CREATED = "March 2026";
const REVIEW_CYCLE = "Quarterly during Data & Evaluation Check-Ins";

const principles = [
  { icon: Users, title: "Human Oversight", text: "AI supports your thinking—but you remain in control. Every output should be reviewed, interpreted, and validated by humans." },
  { icon: Eye, title: "Transparency", text: "You will always know when AI is being used. All AI-generated content is clearly labeled and explained." },
  { icon: Scale, title: "Fairness", text: "We actively work to reduce bias in AI outputs and design the tool to support equitable, inclusive perspectives." },
  { icon: Lock, title: "Privacy", text: "We only process the information you choose to share. Your data is never used to train external AI models without explicit consent and is handled with care." },
  { icon: Shield, title: "Accountability", text: "We log AI interactions to ensure quality, transparency, and responsible use." },
  { icon: AlertTriangle, title: "Safety", text: "We include safeguards to reduce harmful, misleading, or inaccurate outputs." },
];

const AiPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={measureLogo} alt="MEASURE" className="h-8 w-auto" />
            <span className="text-sm text-muted-foreground">AI Acceptable Use Policy</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI Acceptable Use Policy</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Measure AI Acceptable Use Policy
          </h1>
          <p className="text-lg text-muted-foreground">
            Governing responsible AI integration across operations, research, community engagement, and technology platforms
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm text-muted-foreground">
            <span>Version {POLICY_VERSION}</span>
            <span>·</span>
            <span>Created: {POLICY_CREATED}</span>
            <span>·</span>
            <span>Review: {REVIEW_CYCLE}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Oversight: Executive Leadership Team (President, Chief of Research, Chief of Operations)
          </p>
          <div className="mt-4">
            <Link to="/ai-tool-policy" className="text-sm text-primary hover:underline">
              Also see: CARE Model AI Interrogation Tool — Public AI Policy & Data Stewardship Statement →
            </Link>
          </div>
        </div>

        <PolicyTableOfContents />

        {/* Section 1: Purpose */}
        <PolicySection id="purpose" icon={Heart} title="1. Purpose" variant="primary">
          <p className="text-muted-foreground leading-relaxed mb-4">
            Measure mobilizes communities to transform lived experience into data, data into power, and power into systemic change. We operate at the intersection of community organizing and AI governance, working through the CARE Model, Community in the Loop convenings, and national partnerships to ensure communities help shape the AI systems that affect them.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            This policy governs how Measure integrates Artificial Intelligence into operations, research, community engagement, and technology platforms. As an equity-centered nonprofit, Measure uses AI in alignment with justice, accessibility, community accountability, and human dignity.
          </p>
          <PolicyQuote>
            AI at Measure is a tool in service of people and purpose. It must strengthen trust, not weaken it. It must simplify work, not complicate it. It must advance equity, not automate harm.
          </PolicyQuote>
          <p className="text-muted-foreground leading-relaxed">
            This policy affirms the use of the AI Interrogation Tool (AIT) to evaluate tools before deployment and throughout their lifecycle.
          </p>
        </PolicySection>

        {/* Section 2: Joy, Wellness */}
        <PolicySection id="joy-wellness" icon={Zap} title="2. Joy, Wellness, and Responsible AI Use">
          <p className="text-muted-foreground leading-relaxed mb-4">
            Measure operates in high-stress, high-impact environments. This work requires emotional labor, proximity to community trauma, creativity, and sustained collaboration. AI must support sustainable work rhythms and psychological safety. It cannot quietly reintroduce grind culture through speed, pressure, or tool overload.
          </p>
          <p className="text-sm font-semibold text-foreground mb-2">AI at Measure is intended to:</p>
          <PolicyList items={[
            "Reduce unnecessary workload",
            "Improve clarity and access to information",
            "Support excellence without increasing pace",
            "Simplify workflows",
            "Protect staff capacity",
          ]} />
          <p className="text-sm font-semibold text-foreground mb-2">AI must not:</p>
          <PolicyList items={[
            "Intensify productivity expectations without resourcing",
            "Expand tool fatigue or digital overwhelm",
            "Create unrealistic output standards",
            "Encourage constant availability",
            "Undermine psychological safety or authenticity",
          ]} />
          <p className="text-sm text-muted-foreground italic border-t border-border pt-4">
            If AI implementation increases stress, role confusion, burnout risk, or inequitable workload distribution, leadership will pause and reassess.
          </p>
        </PolicySection>

        {/* Section 3: Research Ethics */}
        <PolicySection id="research-ethics" icon={BookOpen} title='3. AI Research Ethics and "Lines in the Sand"'>
          <p className="text-muted-foreground leading-relaxed mb-4">Measure's AI practices are grounded in what we call our "lines in the sand":</p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            <strong className="text-foreground">AI Interrogation:</strong> Measure critically examines AI tools by scrutinizing data sources, algorithms, and decision-making models to uncover embedded biases and structural inequities utilizing the Theory of Interrogative Reasoning.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            <strong className="text-foreground">Community Accountability Over Technological Efficiency:</strong> Our commitment is to the communities we serve, not the convenience of AI. If a tool cannot equitably represent community experiences, Measure will challenge its validity rather than accept its conclusions.
          </p>
          <PolicyQuote>AI may assist analysis. It cannot replace the interpretation of lived experience.</PolicyQuote>
        </PolicySection>

        {/* Section 4: Regulatory Compliance */}
        <PolicySection id="regulatory" icon={FileText} title="4. Regulatory Compliance (Federal and State)">
          <p className="text-muted-foreground leading-relaxed mb-4">Measure complies with applicable federal and state AI guidance:</p>
          <PolicyList items={[
            "Executive Order 14179 (January 23, 2025) – Directs federal agencies to reduce regulatory barriers to AI innovation",
            "TRAIGA / HB 149 – Texas Responsible Artificial Intelligence Governance Act. Primary state law governing Measure's AI use",
            "Texas SB 1188 (Healthcare AI) – Effective September 1, 2025",
            "Resolution 55 – Responsible governance of emerging technologies",
            "NIST AI Risk Management Framework (AI RMF 1.0) – Measure's compliance roadmap",
          ]} />
          <p className="text-sm text-muted-foreground mb-4">Compliance procedures are maintained in Measure's AI Governance Procedures and reviewed quarterly.</p>

          <h3 className="text-lg font-semibold text-foreground mb-3">4A. What TRAIGA Means for Measure</h3>
          <p className="text-muted-foreground leading-relaxed mb-4">
            TRAIGA applies to Measure as a "deployer," meaning we bear responsibility for how third-party AI tools are used even though we did not build them. Certain uses are prohibited by Texas law (see Section 6). All AI tools must be documented in the AI Tool Log with their purpose, testing results, and compliance status.
          </p>
          <p className="text-sm text-muted-foreground italic mb-4">
            If the Texas Attorney General contacts Measure, staff must not respond independently. Notify the Executive Leadership Team immediately.
          </p>

          <h3 className="text-lg font-semibold text-foreground mb-3">4B. Compliance Protection: NIST AI RMF Alignment</h3>
          <p className="text-muted-foreground leading-relaxed">
            TRAIGA includes a safe harbor provision: organizations that actively follow the NIST AI Risk Management Framework have stronger legal protection if compliance is questioned. Measure's existing practices (AIT evaluations, bias audits, the AI Tool Log, ELT quarterly review, and the AI Incident Response Plan) align with NIST requirements.
          </p>
        </PolicySection>

        {/* Section 5: Roles */}
        <PolicySection id="roles" icon={Users} title="5. Roles and Responsibilities (Invested Parties)">
          <p className="text-muted-foreground leading-relaxed mb-4">
            Measure uses the term "invested parties" to reflect shared power and co-design.
          </p>
          <PolicyRolesTable />
        </PolicySection>

        {/* Section 6: Permitted/Prohibited */}
        <PolicySection id="permitted-prohibited" icon={Ban} title="6. Permitted and Prohibited Uses" variant="destructive">
          <p className="text-muted-foreground leading-relaxed mb-4">
            AI may support Measure's work when human oversight is present. Items marked <strong>[TRAIGA]</strong> are also prohibited under Texas law.
          </p>
          <h3 className="text-lg font-semibold text-foreground mb-3">Permitted Uses (human review required):</h3>
          <PolicyList items={[
            "Drafting reports, training materials, internal and external communications",
            "Marketing materials, social media posts, and graphics",
            "Supporting research summaries and synthesis",
            "Preparing early drafts of grant proposals",
            "Generating meeting note drafts",
            "Supporting data exploration (not final decision-making)",
            "Assisting with navigation bots and platform tools",
            "Creating community generated training data",
          ]} />
          <h3 className="text-lg font-semibold text-foreground mb-3">Prohibited Uses:</h3>
          <PolicyList items={[
            "Determining participant eligibility or automating program outcomes",
            "Entering PII, PHI, or sensitive personal data into unapproved systems",
            "Publishing AI-generated content without human review",
            "Using AI for manipulation, misinformation, or to bypass ethical oversight",
            "Surveillance of staff productivity",
            "Deploying AI designed to incite self-harm, harm to others, or criminal activity [TRAIGA]",
            "Deploying AI with intent to unlawfully discriminate based on a protected class [TRAIGA]",
            "Using AI to assign social scores that result in detrimental treatment [TRAIGA]",
            "Using biometric identification from public sources without individual consent [TRAIGA]",
            "Using agentic AI (autonomous multi-step AI) without documented ELT approval, defined scope, and human review of all outputs",
          ]} />
          <p className="text-sm text-muted-foreground italic border-t border-border pt-4">
            If uncertainty exists about whether a use is permitted, the tool must be paused pending review.
          </p>
        </PolicySection>

        {/* Section 7: Personal AI Tool Use */}
        <PolicySection id="personal-use" icon={UserCheck} title="7. Personal AI Tool Use">
          <p className="text-muted-foreground leading-relaxed mb-4">
            Many staff use personal AI accounts such as ChatGPT, Claude, or Gemini for Measure work. Measure acknowledges the value these tools provide, but personal tool use creates compliance risk under TRAIGA and raises data privacy concerns.
          </p>
          <h3 className="text-lg font-semibold text-foreground mb-3">Boundaries:</h3>
          <PolicyList items={[
            "Never enter community member data, participant data, PII, PHI, survey responses, interview transcripts, or any data collected through Measure programs into a personal AI tool",
            "Never enter confidential organizational data including financial records, donor information, personnel matters, or embargoed research",
            "Use Measure-sponsored tools (such as Google Workspace or Measure Ignite) when available",
          ]} />
        </PolicySection>

        {/* Section 8: Branding */}
        <PolicySection id="branding" icon={MessageSquare} title="8. Branding and External Communications">
          <p className="text-muted-foreground leading-relaxed mb-4">
            AI-assisted communications must reflect Measure's voice: clear, justice-centered, grounded, and human.
          </p>
          <p className="text-sm font-semibold text-foreground mb-2">Before external release, remove common AI-generated patterns:</p>
          <PolicyList items={[
            "Generic openings, boilerplate phrasing, overused filler",
            'Artificial word substitutions ("utilize" instead of "use")',
            "Emotionally flat language, excessive em dashes, or unnecessary bold text",
          ]} />
          <p className="text-sm font-semibold text-foreground mb-2">External communications must:</p>
          <PolicyList items={[
            "Be specific, context-aware, and reflective of Measure's values",
            "Avoid assumptions or invented facts",
            "Be fact-checked and edited by a human before release",
          ]} />
        </PolicySection>

        {/* Section 9: AIT */}
        <PolicySection id="ait" icon={Shield} title="9. AI Interrogation Tool and Evaluation" variant="primary">
          <p className="text-muted-foreground leading-relaxed mb-4">
            The AI Interrogation Tool (AIT) is Measure's structured framework for evaluating AI systems before deployment and throughout their lifecycle, currently in development through an RWJF-funded grant. Grounded in the Theory of Interrogative Reasoning, the AIT tests for community power dynamics, accessibility, bias, privacy, transparency, and sustainability.
          </p>
          <PolicyList items={[
            "All AI tools must be evaluated using the AIT prior to deployment",
            "Tools scoring below 3 out of 5 may not be deployed without mitigation and documented approval",
            "All existing tools must be evaluated by Spring 2027",
          ]} />
        </PolicySection>

        {/* Section 10: Tools */}
        <PolicySection id="tools" icon={Briefcase} title="10. AI Tools and Resources">
          <p className="text-muted-foreground leading-relaxed mb-4">
            Measure maintains a living AI Tool Inventory at <a href="https://interrogateai.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">interrogateai.org</a>. The Measure Ignite Platform serves as the community-facing hub for grantee onboarding, storytelling, and AI-assisted reporting. Consult the AI Tool Log and Operations for the current list of approved tools.
          </p>
        </PolicySection>

        {/* Section 11: Engaged Parties */}
        <PolicySection id="engagement" icon={Users} title="11. Invested Party Engagement">
          <p className="text-muted-foreground leading-relaxed mb-4">
            Ethical AI development requires deep, inclusive engagement.
          </p>
          <h3 className="text-lg font-semibold text-foreground mb-3">Invested Party Identification:</h3>
          <PolicyList items={[
            "Who benefits? Staff, clients, community partners, and platform users",
            "Who may be excluded or harmed? Individuals with limited tech access or without a voice in design",
            "Who has influence? Measure staff, ELT, funders, tech developers, and partner organizations",
          ]} />
          <h3 className="text-lg font-semibold text-foreground mb-3">Engagement Process:</h3>
          <PolicyList items={[
            "Conduct CARE Model sessions with the community",
            "Seek input on AI opportunities, risks, and workflow improvement",
            "Prioritize equity, representation, and community validation",
          ]} />
        </PolicySection>

        {/* Section 12: Consent, Credit, Compensation */}
        <PolicySection id="consent-credit" icon={Heart} title="12. Consent, Credit, and Compensation" variant="secondary">
          <p className="text-muted-foreground leading-relaxed mb-4">
            When engaging the community in AI interrogation or co-design, Measure must:
          </p>
          <PolicyList items={[
            "Disclose when AI is used in analysis",
            "Clarify how community input informs AI systems",
            "Provide credit when contributions shape tools or outputs",
            "Compensate community members when contributions materially inform AI development",
            "Avoid extractive use of lived experience",
          ]} />
          <PolicyQuote>Community knowledge is not free labor.</PolicyQuote>
        </PolicySection>

        {/* Section 13: Risk Management */}
        <PolicySection id="risk" icon={AlertTriangle} title="13. Risk Management and Feedback">
          <p className="text-muted-foreground leading-relaxed mb-4">
            Responsible AI requires active monitoring, not passive approval. Measure maintains an AI Tool Log, conducts periodic bias audits, requires human review for all external outputs, and will escalate and pause tools if harm is detected. All Tool Log entries are retained for a minimum of three years.
          </p>

          <h3 className="text-lg font-semibold text-foreground mb-3">13A. Community AI Disclosure</h3>
          <PolicyList items={[
            "Measure discloses when community members are interacting with an AI-powered tool at or before first interaction",
            "When AI is used to analyze community-sourced data, Measure discloses this in any report sharing those findings",
            "Where AI could materially affect a participant's access or service experience, informed consent is required",
            "Disclosure language must be plain and accessible",
          ]} />

          <h3 className="text-lg font-semibold text-foreground mb-3">13B. Vendor and Third-Party Accountability</h3>
          <p className="text-muted-foreground leading-relaxed">
            As a deployer under TRAIGA, Measure bears compliance responsibility for third-party AI tools. Vendors must confirm their systems meet TRAIGA requirements, disclose limitations, and participate in AIT evaluations.
          </p>
        </PolicySection>

        {/* Section 14: Digital Privacy */}
        <PolicySection id="privacy" icon={Lock} title="14. Digital Privacy and Access Controls">
          <p className="text-muted-foreground leading-relaxed mb-4">
            AI-integrated systems such as transcription tools must be used responsibly:
          </p>
          <PolicyList items={[
            "Restrict transcript and recording access to authorized individuals",
            "Immediately report accidental access",
            "Redact identifying information before internal sharing",
            "Treat violations as data privacy incidents and notify supervisor immediately",
            "Never upload PHI or PII to any AI system",
          ]} />
        </PolicySection>

        {/* Section 15: Environmental */}
        <PolicySection id="environmental" icon={Leaf} title="15. Environmental and Systemic Responsibility">
          <p className="text-muted-foreground leading-relaxed mb-4">
            AI carries both social and environmental consequences. Using Measure's Concentric Circles of Responsibility model:
          </p>
          <h3 className="text-lg font-semibold text-foreground mb-3">Direct Responsibility (Ours to Own):</h3>
          <PolicyList items={[
            "Educate staff and community on AI's environmental footprint, including how energy demands, water usage, and data center siting disproportionately burden frontline BIPOC communities",
            "Use CARE Model sessions to interrogate both biased outputs and hidden environmental costs",
            "Build environmental accountability into project proposals and AIT evaluations",
          ]} />
          <h3 className="text-lg font-semibold text-foreground mb-3">Shared Responsibility (With Partners and Funders):</h3>
          <PolicyList items={[
            "Partner with advocacy groups, tech ethicists, and environmental justice organizations",
            "Work with funders to monitor environmental and social impact of AI usage",
          ]} />
          <h3 className="text-lg font-semibold text-foreground mb-3">Systemic Responsibility (Beyond Us):</h3>
          <PolicyList items={[
            "Advocate for corporate transparency on carbon and water usage",
            "Support AI regulation as both a civil rights and environmental justice issue",
            'Push funders to support intersectional work rather than siloing "tech equity" and "climate equity"',
          ]} />
        </PolicySection>

        {/* Section 16: Training */}
        <PolicySection id="training" icon={BookOpen} title="16. Training and Continuous Improvement">
          <p className="text-muted-foreground leading-relaxed mb-4">
            AI governance at Measure is ongoing and will evolve alongside practice. All staff receive training on ethical AI use, bias awareness, and workflow tools. AI governance is integrated into onboarding, CORE meetings, and team development. This policy is reviewed quarterly during Data & Evaluation meetings with input from staff, partners, and community.
          </p>
        </PolicySection>

        {/* Conclusion */}
        <PolicySection icon={Heart} title="Conclusion" variant="primary">
          <PolicyQuote>
            AI at Measure exists to strengthen equity, not replace humanity. It must simplify work, protect dignity, support wellness, and advance responsible innovation. When AI conflicts with community accountability or staff well-being, community and well-being take priority.
          </PolicyQuote>
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Companion Documents:</strong> Appendix A: AI Incident Response Plan (AIRP), Appendix B: AI at Measure — What You Need to Know, AI Governance Procedures
          </p>
        </PolicySection>

        {/* Core Principles Cards */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">How We Use AI Responsibly</h2>
          <p className="text-center text-muted-foreground mb-8">Six core principles guide this platform:</p>
          <div className="grid md:grid-cols-2 gap-4">
            {principles.map((p, i) => (
              <div key={i} className="p-5 border border-border rounded-lg hover:border-primary/30 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <p.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{p.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{p.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Appendix A */}
        <PolicySection id="appendix-a" icon={AlertTriangle} title="Appendix A: AI Incident Response Plan (AIRP)" variant="destructive">
          <p className="text-xs text-muted-foreground mb-4">Version 1 (Draft) · Under active development · Last Updated: August 2025</p>
          
          <h3 className="text-lg font-semibold text-foreground mb-3">What Counts as an Incident</h3>
          <p className="text-muted-foreground leading-relaxed mb-4">
            An AI incident is any event where AI use at Measure produces biased or harmful outputs, mishandles data or PII, undermines community trust, fails AIT standards after deployment, involves misuse or misinformation, or creates operational or compliance risks.
          </p>

          <h3 className="text-lg font-semibold text-foreground mb-3">Response Workflow</h3>
          <PolicyList items={[
            "1. Detect & Report — Identify harm, log in AI Tool Log, report to ELT",
            "2. Triage — Low: internal fix. Medium: revalidation required. High: tool suspended immediately",
            "3. Contain — Pause tool, restrict data access if breached, notify stakeholders",
            "4. Investigate — Document date, tool, harm, impact, and action taken",
            "5. Correct — Update, retrain, or retire tool. Retrain staff if misuse. Notify community if impacted",
            "6. Learn — ELT reviews at next quarterly check-in. Update policy and training as needed",
          ]} />

          <h3 className="text-lg font-semibold text-foreground mb-3">Escalation Timeline</h3>
          <PolicyList items={[
            "24 hours: Notify ELT, contain incident",
            "48 hours: Preliminary assessment and documentation",
            "72 hours: Corrective action plan and communication strategy",
            "1 week: Final Incident Report to ELT, update AI Tool Log",
          ]} />
        </PolicySection>

        {/* Appendix B */}
        <PolicySection id="appendix-b" icon={Globe} title="Appendix B: AI at Measure — What You Need to Know" variant="secondary">
          <p className="text-muted-foreground leading-relaxed mb-4">
            AI is already shaping decisions about health, education, housing, policing, and public funding. Too often, the communities most affected have no voice in how these systems are designed, and no say in how their data is used. Communities remain over-studied but under-heard. Measure exists to change that.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We mobilize communities to transform lived experience into data, data into power, and power into systemic change. Through our Community in the Loop convenings, the CARE Model, and local and national partnerships, we are working to ensure communities do not just get consulted about AI — they help shape it.
          </p>

          <h3 className="text-lg font-semibold text-foreground mb-3">Our Commitments</h3>
          <PolicyList items={[
            "Measure discloses when AI is part of your experience with us — whether on our website, through the Ignite platform, in programming, or in reports",
            "We are committed to testing every AI tool for bias, privacy, and cultural relevance before use through the AI Interrogation Tool (AIT)",
            "AI at Measure never makes decisions about who receives services or how programs are delivered",
            "AI never replaces the interpretation of lived experience and never operates without human oversight",
            "Measure complies with federal and Texas state AI governance laws, including TRAIGA",
          ]} />

          <h3 className="text-lg font-semibold text-foreground mb-3">Your Role</h3>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Measure treats everyone connected to our work as invested parties, not just stakeholders. Through CARE Model sessions, Community in the Loop convenings, and co-design processes, invested parties inform how AI is built, evaluated, and used. When your contributions shape a tool or an outcome, they are credited and, where appropriate, compensated.
          </p>

          <PolicyQuote>
            AI at Measure is not about efficiency alone. It is about equity, accountability, and community power.
          </PolicyQuote>

          <p className="text-sm text-muted-foreground">
            Questions or concerns? Visit <a href="https://interrogateai.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">interrogateai.org</a> or contact <a href="mailto:hello@wemeasure.org" className="text-primary hover:underline">hello@wemeasure.org</a>
          </p>
        </PolicySection>

        {/* Footer */}
        <div className="text-center py-8 border-t border-border">
          <p className="text-muted-foreground mb-2">
            Learn more at <a href="https://wemeasure.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">wemeasure.org</a> and <a href="https://interrogateai.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">interrogateai.org</a>
          </p>
          <p className="text-sm text-muted-foreground italic">
            We are committed to learning, improving, and building this with you.
          </p>
        </div>
      </main>
    </div>
  );
};

export default AiPolicy;
