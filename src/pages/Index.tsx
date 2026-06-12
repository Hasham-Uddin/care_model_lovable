import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import measureLogo from "@/assets/measure-logo.png";
import { 
  ArrowRight, 
  Users, 
  Lightbulb, 
  BookOpen, 
  CheckCircle, 
  Sparkles,
  Target,
  Heart,
  MessageCircle,
  BarChart3,
  Shield,
  Zap
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: BookOpen,
      title: "12-Session Guided Curriculum",
      description: "A structured facilitation journey from problem statement to community impact metrics, aligned with the CARE Model workbook."
    },
    {
      icon: Sparkles,
      title: "AI Co-Facilitation",
      description: "Get real-time AI-generated guidance for each session, with built-in bias detection using Theory of Interrogative Reasoning."
    },
    {
      icon: Heart,
      title: "Values-Based Icebreakers",
      description: "Start every session with relationship-building activities that ground your team in shared core values."
    },
    {
      icon: BarChart3,
      title: "Video Tutorials Per Session",
      description: "Watch short guided tutorials before each meeting to prepare your facilitation approach."
    },
    {
      icon: Shield,
      title: "Ethical AI Governance",
      description: "Full AI policy consent workflow, data contribution opt-in, and community-controlled data commons."
    },
    {
      icon: Target,
      title: "Project Export & Tracking",
      description: "Export complete project guides as PDFs, track session progress, and manage multiple community projects."
    }
  ];


  const steps = [
    {
      number: "01",
      title: "Create a Project",
      description: "Set up your CARE Model project, agree to the AI policy, and optionally opt in to the Community Data Commons."
    },
    {
      number: "02",
      title: "Facilitate 12 Sessions",
      description: "Follow the guided curriculum with icebreakers, video tutorials, AI co-facilitation, and structured worksheets."
    },
    {
      number: "03",
      title: "Build Community Impact",
      description: "Generate artifacts, interrogate AI outputs for bias, and export your complete facilitation guide."
    }
  ];

  const challenges = [
    {
      problem: "Spending hours preparing sessions without structured frameworks",
      solution: "A 12-session curriculum with guided worksheets, video tutorials, and AI-generated starter content for each meeting"
    },
    {
      problem: "Missing community voices or perpetuating bias unintentionally",
      solution: "Built-in Interrogative Reasoning that challenges AI outputs for bias, deficit framing, and cultural misreads"
    },
    {
      problem: "Scattered notes and no clear way to track community progress",
      solution: "Integrated project dashboard with session artifacts, PDF export, and optional data contribution to the Community Data Commons"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={measureLogo} alt="MEASURE" className="h-10 w-auto" />
          </div>
          <Button onClick={() => navigate("/auth")} variant="default">
            Sign In
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-foreground opacity-95" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(228_60%_50%/0.3),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(31_79%_58%/0.2),transparent_50%)]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 rounded-full px-4 py-2 mb-8">
              <Heart className="h-4 w-4 text-secondary" />
              <span className="text-sm text-primary-foreground/90">Built for CARE Model Facilitators</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-6 leading-tight">
              A 12-session guided curriculum for{" "}
              <span className="text-secondary">equitable community mobilization</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto leading-relaxed">
              Facilitate the CARE Model workbook with AI co-facilitation, bias detection, 
              values-based icebreakers, video tutorials, and structured worksheets — all in one platform.
            </p>
            
            <div className="flex justify-center">
              <Button 
                onClick={() => navigate("/auth")}
                size="lg"
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground text-lg px-8 py-6 h-auto shadow-lg"
              >
                Start Facilitating <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Decorative bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))"/>
          </svg>
        </div>
      </section>

      {/* Problem → Solution Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              We understand your challenges
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Facilitating community change is complex. You need tools that match the depth of your work.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {challenges.map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-muted rounded-xl p-6 mb-4 border border-border">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-destructive text-xs">✕</span>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.problem}</p>
                  </div>
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 -mt-2 mb-2">
                  <ArrowRight className="h-5 w-5 text-secondary rotate-90" />
                </div>
                <div className="bg-card rounded-xl p-6 border-2 border-secondary/30 shadow-md mt-6">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <CheckCircle className="h-4 w-4 text-secondary" />
                    </div>
                    <p className="text-foreground text-sm font-medium leading-relaxed">{item.solution}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block text-secondary font-semibold text-sm uppercase tracking-wider mb-3">
              Platform Features
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything you need to facilitate with impact
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Purpose-built tools for CARE Model facilitators, designed with community equity at the center.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="bg-card rounded-xl p-6 border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block text-secondary font-semibold text-sm uppercase tracking-wider mb-3">
              How It Works
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Get started in three simple steps
            </h2>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <div key={index} className="text-center relative">
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/30 to-transparent" />
                  )}
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <span className="text-3xl font-bold text-primary-foreground">{step.number}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* Final CTA Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="mb-8">
              <img src={measureLogo} alt="MEASURE" className="h-16 w-auto mx-auto mb-6" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Ready to facilitate with confidence?
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
              Join facilitators across the country using CARE Model tools to drive equitable community action.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => navigate("/auth")}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6 h-auto shadow-lg"
              >
                <Zap className="mr-2 h-5 w-5" />
                Get Started
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="border-border text-foreground hover:bg-muted text-lg px-8 py-6 h-auto"
                onClick={() => window.open("https://wemeasure.org/data-support/", "_blank")}
              >
                <Lightbulb className="mr-2 h-5 w-5" />
                Learn About CARE Model
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-muted border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={measureLogo} alt="MEASURE" className="h-8 w-auto" />
              <span className="text-sm text-muted-foreground">
                © 2025 MEASURE. All rights reserved.
              </span>
            </div>
            <div className="flex items-center gap-6">
              <a href="/ai-policy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                AI Policy
              </a>
              <a href="/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </a>
              <a href="/terms-of-service" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
