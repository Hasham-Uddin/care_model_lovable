import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowLeft, CalendarIcon, Shield, ExternalLink, CheckCircle2, PlayCircle } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { z } from "zod";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const projectFormSchema = z.object({
  projectName: z.string().trim().min(1, "Project name is required").max(200, "Project name must be under 200 characters"),
  orgName: z.string().trim().min(1, "Organization name is required").max(200, "Organization name must be under 200 characters"),
  orgLocation: z.string().trim().min(1, "Location is required").max(200, "Location must be under 200 characters"),
  orgMission: z.string().trim().max(2000, "Mission must be under 2000 characters").optional().or(z.literal("")),
});

const SESSION_NAMES = [
  "Problem Statement",
  "Define Community", 
  "Historical Timeline",
  "Invested Parties",
  "Data Storytelling",
  "Community Asset Mapping",
  "Solutions Alignment",
  "Theory of Change I",
  "Theory of Change II",
  "Community Impact Metrics",
  "Data Collection Plan",
  "Showcase & Sharing"
];

const CreateProject = () => {
  const [loading, setLoading] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgLocation, setOrgLocation] = useState("");
  const [orgMission, setOrgMission] = useState("");
  const [dataDonation, setDataDonation] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [aiPolicyAcknowledged, setAiPolicyAcknowledged] = useState(false);
  const [dataNotForTraining, setDataNotForTraining] = useState(false);
  const [aiAdvisoryOnly, setAiAdvisoryOnly] = useState(false);
  const navigate = useNavigate();

  const allConsentChecked = aiPolicyAcknowledged && dataNotForTraining && aiAdvisoryOnly;

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validated = projectFormSchema.parse({
        projectName, orgName, orgLocation, orgMission,
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Log AI policy consent
      await supabase.from("ai_consent_log").upsert({
        user_id: user.id,
        consent_given: true,
        consent_version: "1.0",
        acknowledged_at: new Date().toISOString(),
      }, { onConflict: "user_id,consent_version" });

      // Create organization
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: validated.orgName,
          location: validated.orgLocation,
          mission: validated.orgMission || null
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Create project
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          name: validated.projectName,
          organization_id: org.id,
          facilitator_id: user.id,
          data_donation_consent: dataDonation,
          data_anonymized: true,
          start_date: startDate ? format(startDate, "yyyy-MM-dd") : null,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Facilitator is the default CARE Team Leader on the project roster
      const { error: memberError } = await supabase.from("project_members").insert({
        project_id: project.id,
        user_id: user.id,
        role: "care_team_leader",
      });
      if (memberError) throw memberError;

      // Create 12 sessions
      const sessionsToCreate = SESSION_NAMES.map((name, index) => ({
        project_id: project.id,
        session_number: index + 1,
        session_name: name,
        status: "not_started" as const
      }));

      const { error: sessionsError } = await supabase
        .from("sessions")
        .insert(sessionsToCreate);

      if (sessionsError) throw sessionsError;

      toast.success("Project created successfully!");
      navigate(`/project/${project.id}`);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0]?.message || "Validation failed");
      } else {
        toast.error(error.message || "Failed to create project");
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold">Create New CARE Project</h1>
            <p className="text-muted-foreground mt-1">
              Set up a new community mobilization project
            </p>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <form onSubmit={handleCreateProject} className="space-y-6">
            <Card className="p-6 shadow-elevated">
              <h2 className="text-xl font-semibold mb-4">Project Information</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="projectName">Project Name *</Label>
                  <Input
                    id="projectName"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g., Youth Education Equity Initiative"
                    required
                  />
                </div>
                <div>
                  <Label>Project Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal mt-1",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Select start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </Card>

            <Card className="p-6 shadow-elevated">
              <h2 className="text-xl font-semibold mb-4">Partner Organization</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="orgName">Organization Name *</Label>
                  <Input
                    id="orgName"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Partner organization name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="orgLocation">Location *</Label>
                  <Input
                    id="orgLocation"
                    value={orgLocation}
                    onChange={(e) => setOrgLocation(e.target.value)}
                    placeholder="City, State"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="orgMission">Mission Statement</Label>
                  <Textarea
                    id="orgMission"
                    value={orgMission}
                    onChange={(e) => setOrgMission(e.target.value)}
                    placeholder="Organization's mission and goals..."
                    rows={3}
                  />
                </div>
              </div>
            </Card>

            {/* AI Policy Introduction Video */}
            <Card className="p-6 shadow-elevated border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <PlayCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Understanding Our AI Governance</h2>
                  <p className="text-xs text-muted-foreground">A brief overview of how we use AI responsibly</p>
                </div>
              </div>
              <div className="max-w-md mx-auto">
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black border-2 border-primary/20 shadow-md">
                  <video
                    className="w-full h-full object-contain"
                    controls
                    preload="metadata"
                    crossOrigin="anonymous"
                  >
                    <source src="/videos/ai-policy-intro.mp4" type="video/mp4" />
                    <track
                      kind="captions"
                      src="/videos/ai-policy-intro.vtt"
                      srcLang="en"
                      label="English"
                      default
                    />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Closed captions available — click CC in the video player
              </p>
            </Card>

            <Card className="p-6 shadow-elevated border-primary/30 bg-primary/5">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">AI Policy & Ethical Governance</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                This project uses AI to assist with facilitation. Before proceeding, you must review and acknowledge our AI policy commitments.
              </p>

              <div className="bg-card border border-border rounded-lg p-4 mb-4 space-y-3 text-sm text-muted-foreground">
                <p><strong className="text-foreground">Our commitment to your community:</strong></p>
                <ul className="space-y-1.5 ml-4">
                  <li>• All AI-generated content is clearly labeled — you will always know when AI is being used</li>
                  <li>• Your data is never used to train external AI models without your explicit consent</li>
                  <li>• AI features are completely optional and do not make decisions about service eligibility</li>
                  <li>• Outputs are advisory only — not automated decisions. Human review is required for all external content</li>
                  <li>• Anti-bias checks are built into every response using the AI Interrogation Tool (AIT) framework</li>
                  <li>• This platform complies with the Texas Responsible AI Governance Act (TRAIGA) and aligns with the NIST AI Risk Management Framework</li>
                  
                </ul>
                <p className="italic text-xs pt-1">
                  "AI at Measure is a tool in service of people and purpose. It must strengthen trust, not weaken it. It must simplify work, not complicate it. It must advance equity, not automate harm."
                </p>
              </div>

              <div className="flex flex-col gap-1 mb-4">
                <Button
                  variant="link"
                  type="button"
                  className="p-0 h-auto text-sm justify-start"
                  onClick={() => window.open("/ai-policy", "_blank")}
                >
                  <ExternalLink className="mr-1 h-3 w-3" />
                  Read the AI Acceptable Use Policy
                </Button>
                <Button
                  variant="link"
                  type="button"
                  className="p-0 h-auto text-sm justify-start"
                  onClick={() => window.open("/ai-tool-policy", "_blank")}
                >
                  <ExternalLink className="mr-1 h-3 w-3" />
                  Read the CARE Model AI Tool Policy & Data Stewardship Statement
                </Button>
              </div>

              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="ai-policy-ack"
                    checked={aiPolicyAcknowledged}
                    onCheckedChange={(v) => setAiPolicyAcknowledged(v === true)}
                  />
                  <label htmlFor="ai-policy-ack" className="text-sm leading-relaxed cursor-pointer">
                    I have reviewed and acknowledge Measure's AI Acceptable Use Policy. I understand that AI outputs are advisory, subject to bias, and must be critically examined. I understand this platform complies with TRAIGA and aligns with the NIST AI Risk Management Framework.
                  </label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="data-not-training"
                    checked={dataNotForTraining}
                    onCheckedChange={(v) => setDataNotForTraining(v === true)}
                  />
                  <label htmlFor="data-not-training" className="text-sm leading-relaxed cursor-pointer">
                    I understand that community data will <strong>not</strong> be used to train external AI models without explicit consent. I will not enter PII, PHI, or sensitive personal data into the AI system.
                  </label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="ai-advisory"
                    checked={aiAdvisoryOnly}
                    onCheckedChange={(v) => setAiAdvisoryOnly(v === true)}
                  />
                  <label htmlFor="ai-advisory" className="text-sm leading-relaxed cursor-pointer">
                    I confirm that all AI-generated outputs will be treated as advisory only, will not replace community decision-making, and that I will review all AI-assisted content before any external use. Community knowledge is not free labor—contributions will be credited and, where appropriate, compensated.
                  </label>
                </div>

                {allConsentChecked && (
                  <div className="flex items-center gap-2 text-sm text-primary pt-1">
                    <CheckCircle2 className="h-4 w-4" />
                    AI Policy acknowledged — you may proceed.
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6 shadow-elevated bg-accent/5 border-accent/20">
              <h2 className="text-xl font-semibold mb-2">Data Contribution</h2>
              <p className="text-sm text-muted-foreground mb-4">
                By opting in to data contribution, you help improve AI fairness and reduce bias through interrogative feedback.
              </p>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="dataDonation" className="font-semibold">
                    Opt-in to Data Contribution
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    All data is anonymized. You can revoke consent anytime.
                  </p>
                </div>
                <Switch
                  id="dataDonation"
                  checked={dataDonation}
                  onCheckedChange={setDataDonation}
                />
              </div>
            </Card>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !allConsentChecked}
                className="flex-1 shadow-elevated"
              >
                <Shield className="mr-2 h-4 w-4" />
                {loading ? "Creating..." : "Acknowledge & Create Project"}
              </Button>
            </div>

            {!allConsentChecked && (
              <p className="text-xs text-muted-foreground text-center">
                You must acknowledge all three AI policy statements above to create a project.
              </p>
            )}
          </form>
        </main>
      </div>
    </AuthGuard>
  );
};

export default CreateProject;