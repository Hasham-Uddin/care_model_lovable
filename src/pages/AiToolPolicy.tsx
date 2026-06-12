import { ArrowLeft, Shield, Eye, Scale, Lock, Users, AlertTriangle, Heart, BookOpen, HelpCircle, Database, Settings, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import measureLogo from "@/assets/measure-logo.png";
import { PolicySection, PolicyList, PolicyQuote } from "@/components/policy/PolicySection";

const principles = [
  { icon: Users, title: "Human Oversight", text: "AI supports your thinking—but you remain in control. Every output should be reviewed, interpreted, and validated by humans." },
  { icon: Eye, title: "Transparency", text: "You will always know when AI is being used. All AI-generated content is clearly labeled and explained." },
  { icon: Scale, title: "Fairness", text: "We actively work to reduce bias in AI outputs and design the tool to support equitable, inclusive perspectives." },
  { icon: Lock, title: "Privacy", text: "We only process the information you choose to share. Your data is never used to train external AI models and is handled with care." },
  { icon: Shield, title: "Accountability", text: "We log AI interactions to ensure quality, transparency, and responsible use." },
  { icon: AlertTriangle, title: "Safety", text: "We include safeguards to reduce harmful, misleading, or inaccurate outputs." },
];

const AiToolPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={measureLogo} alt="MEASURE" className="h-8 w-auto" />
            <span className="text-sm text-muted-foreground">Public AI Policy & Data Stewardship</span>
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
            <span className="text-sm font-medium text-primary">Public AI Policy</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            CARE Model AI Interrogation Tool
          </h1>
          <p className="text-lg text-muted-foreground">
            Public AI Policy & Data Stewardship Statement
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Last Updated: April 2026
          </p>
          <div className="mt-4">
            <Link to="/ai-policy" className="text-sm text-primary hover:underline">
              Also see: Measure AI Acceptable Use Policy →
            </Link>
          </div>
        </div>

        {/* Our Commitment */}
        <PolicySection icon={Heart} title="Our Commitment" variant="primary">
          <p className="text-muted-foreground leading-relaxed mb-4">
            At Measure, we believe artificial intelligence should strengthen communities—not replace them.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            The CARE Model AI Interrogation Tool is designed to support people in asking better questions, challenging systems, and turning lived experience into meaningful insight. It is grounded in responsible AI practices and guided by the Theory of Interrogative Reasoning.
          </p>
          <PolicyQuote>
            We do not use AI to decide for communities. We use AI to strengthen how communities interrogate decisions.
          </PolicyQuote>
        </PolicySection>

        {/* What This Tool Does */}
        <PolicySection icon={BookOpen} title="What This Tool Does">
          <p className="text-muted-foreground leading-relaxed mb-4">
            The CARE Model AI Interrogation Tool helps users:
          </p>
          <PolicyList items={[
            "Organize community insights and lived experiences",
            "Generate reflective questions and themes",
            "Support evaluation, advocacy, and decision-making processes",
          ]} />
          <p className="text-sm text-muted-foreground italic border-t border-border pt-4">
            This tool is not a decision-maker. All outputs are intended to support human thinking—not replace it.
          </p>
        </PolicySection>

        {/* Six Core Principles */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">How We Use AI Responsibly</h2>
          <p className="text-center text-muted-foreground mb-8">We follow six core principles in how this tool operates:</p>
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

        {/* How This Tool Works */}
        <PolicySection icon={Settings} title="How This Tool Works">
          <p className="text-muted-foreground leading-relaxed mb-4">
            This is a prompt-based system, meaning:
          </p>
          <PolicyList items={[
            "The quality of outputs depends on what you enter",
            "AI reflects patterns—it does not understand lived experience",
            "Results should be treated as starting points, not final answers",
          ]} />
          <p className="text-sm text-muted-foreground italic">
            We encourage users to ask follow-up questions, challenge outputs, and revisit results.
          </p>
        </PolicySection>

        {/* Your Role as a User */}
        <PolicySection icon={Users} title="Your Role as a User">
          <p className="text-muted-foreground mb-4">Using this tool means actively participating in the process. We ask that you:</p>
          <PolicyList items={[
            "Provide accurate and thoughtful input",
            "Review and question AI-generated outputs",
            "Avoid submitting harmful or misleading information",
            "Center community voice and lived experience",
          ]} />
          <p className="text-sm font-medium text-foreground italic">AI is a tool. Interrogation is a human responsibility.</p>
        </PolicySection>

        {/* Bias & Critical Reflection */}
        <PolicySection icon={Eye} title="Bias & Critical Reflection" variant="secondary">
          <p className="text-muted-foreground mb-4">Bias can come from both:</p>
          <PolicyList items={[
            "The AI system",
            "The way information is entered",
          ]} />
          <p className="text-muted-foreground mb-4">
            This tool is designed to help you identify and challenge bias—not reinforce it.
          </p>
          <p className="text-sm text-muted-foreground italic">
            If something feels off, we encourage you to question it, refine your input, and continue the interrogation process.
          </p>
        </PolicySection>

        {/* Your Data & Privacy */}
        <PolicySection icon={Lock} title="Your Data & Privacy">
          <p className="text-muted-foreground mb-4">We are committed to protecting your data.</p>
          <PolicyList items={[
            "We only process what you choose to submit",
            "We do not access unrelated files or systems",
            "Sensitive information (like passwords or financial data) should not be entered",
            "Your data is not used to train third-party AI systems",
            "AI interactions are stored temporarily for quality purposes and then deleted",
          ]} />

          <h3 className="text-lg font-semibold text-foreground mb-3">Your Choice & Control</h3>
          <p className="text-muted-foreground mb-4">Using AI features is completely optional.</p>
          <PolicyList items={[
            "You can choose whether or not to use AI within the CARE Model",
            "You can stop using AI features at any time",
            "The CARE Model framework remains available without AI",
          ]} />

          <h3 className="text-lg font-semibold text-foreground mb-3">No Automated Decisions</h3>
          <p className="text-muted-foreground mb-4">This tool does not:</p>
          <PolicyList items={[
            "Make legal, financial, or policy decisions",
            "Replace human judgment",
            "Act without your input",
          ]} />
          <p className="text-sm text-muted-foreground font-medium">
            All outputs are advisory and reflective only.
          </p>
        </PolicySection>

        {/* Understanding Limitations */}
        <PolicySection icon={AlertTriangle} title="Understanding Limitations" variant="destructive">
          <p className="text-muted-foreground mb-4">AI is not perfect. It may:</p>
          <PolicyList items={[
            "Provide incomplete or inaccurate information",
            "Misinterpret context",
            "Reflect bias or assumptions",
          ]} />
          <p className="text-sm font-medium text-foreground italic">That's why your interpretation matters most.</p>
        </PolicySection>

        {/* Community Data Commons */}
        <PolicySection icon={Database} title="Looking Ahead: Community Data Commons">
          <p className="text-muted-foreground mb-4">
            In the future, we may introduce a Community Data Commons—a shared, opt-in system where organizations can choose to contribute anonymized data generated through the CARE Model.
          </p>
          <p className="text-muted-foreground mb-2 font-medium">The goal is to:</p>
          <PolicyList items={[
            "Recognize community data as valuable",
            "Support shared ownership and governance",
            "Create opportunities for equitable value and revenue sharing",
          ]} />
          <p className="text-muted-foreground mb-2 font-medium">Important commitments:</p>
          <PolicyList items={[
            "Participation will always be optional (opt-in only)",
            "Organizations will retain ownership of their data",
            "No data will be used without clear, informed consent",
            "Organizations will be able to opt out at any time",
          ]} />
          <PolicyQuote>Community data should be stewarded—not extracted.</PolicyQuote>
          <p className="text-sm text-muted-foreground italic">
            More details will be shared before this feature is introduced.
          </p>
        </PolicySection>

        {/* Our Ethical Foundation */}
        <PolicySection icon={Heart} title="Our Ethical Foundation" variant="primary">
          <p className="text-muted-foreground mb-4">This tool exists to:</p>
          <PolicyList items={[
            "Center community voice",
            "Support equitable systems change",
            "Turn lived experience into actionable insight",
          ]} />
          <p className="text-muted-foreground mb-2">It is grounded in this belief:</p>
          <PolicyQuote>The people closest to the problem are closest to the solution.</PolicyQuote>
        </PolicySection>

        {/* Questions or Concerns */}
        <div className="text-center py-8 border-t border-border">
          <div className="flex items-center justify-center gap-2 mb-4">
            <HelpCircle className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Questions or Concerns</h2>
          </div>
          <p className="text-muted-foreground mb-4">
            If you have questions, feedback, or concerns about how AI is used in this tool, we welcome you to reach out.
          </p>
          <p className="text-sm text-muted-foreground italic mb-6">
            We are committed to learning, improving, and building this with you.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <a href="https://interrogateai.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">interrogateai.org</a>
            <span className="text-muted-foreground">·</span>
            <a href="mailto:hello@wemeasure.org" className="text-primary hover:underline">hello@wemeasure.org</a>
            <span className="text-muted-foreground">·</span>
            <a href="https://wemeasure.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">wemeasure.org</a>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AiToolPolicy;
