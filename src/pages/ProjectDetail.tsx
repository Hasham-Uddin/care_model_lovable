import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, FileText, CheckCircle2, Circle, PlayCircle, Trash2, Info, CalendarIcon, Loader2, Sparkles, ChevronDown } from "lucide-react";
import { DataDonationDialog } from "@/components/DataDonationDialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { InviteTeamDialog } from "@/components/project/InviteTeamDialog";
import { ProjectTeamList } from "@/components/project/ProjectTeamList";
import { PdfPreviewDialog } from "@/components/project/PdfPreviewDialog";
import { toast } from "sonner";
import { AuthGuard } from "@/components/AuthGuard";
import { generateProjectPdfPreview, PdfPreviewData, PdfMode } from "@/utils/exportProjectPdf";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";



interface Session {
  id: string;
  session_number: number;
  session_name: string;
  status: "not_started" | "in_progress" | "completed";
  completed_at: string | null;
  notes: string | null;
  next_steps: string | null;
}

interface Project {
  id: string;
  name: string;
  data_donation_consent: boolean;
  start_date: string | null;
  end_date: string | null;
  organizations: {
    name: string;
    location: string;
    mission: string;
  };
}

const ProjectDetail = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [pdfPreview, setPdfPreview] = useState<PdfPreviewData | null>(null);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [generatingPdfMode, setGeneratingPdfMode] = useState<PdfMode | null>(null);
  const [updatingConsent, setUpdatingConsent] = useState(false);
  const [confirmRevokeOpen, setConfirmRevokeOpen] = useState(false);
  const navigate = useNavigate();

  const updateDataConsent = async (newValue: boolean) => {
    if (!project) return;
    setUpdatingConsent(true);
    const previous = project.data_donation_consent;
    setProject({ ...project, data_donation_consent: newValue });
    const { error } = await supabase
      .from("projects")
      .update({ data_donation_consent: newValue })
      .eq("id", project.id);
    setUpdatingConsent(false);
    if (error) {
      setProject({ ...project, data_donation_consent: previous });
      toast.error("Failed to update Data Contribution preference", {
        description: error.message,
      });
      return;
    }
    toast.success(
      newValue
        ? "Data Contribution enabled — thank you for contributing to anti-bias datasets."
        : "Data Contribution disabled — no future interrogations from this project will be shared."
    );
  };

  const handleConsentToggle = (next: boolean) => {
    if (!next && project?.data_donation_consent) {
      // Confirm before revoking
      setConfirmRevokeOpen(true);
      return;
    }
    updateDataConsent(next);
  };

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      // Fetch project with organization
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select(`
          *,
          organizations (
            name,
            location,
            mission
          )
        `)
        .eq("id", projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Fetch sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("sessions")
        .select("*")
        .eq("project_id", projectId)
        .order("session_number", { ascending: true });

      if (sessionsError) throw sessionsError;
      setSessions(sessionsData || []);
    } catch (error: any) {
      toast.error("Failed to load project");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getPhase = (sessionNum: number) => {
    if (sessionNum <= 5) return "Phase 1: Assessment";
    if (sessionNum <= 10) return "Phase 2: Solution Development";
    return "Phase 3: Implementation";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-accent" />;
      case "in_progress":
        return <PlayCircle className="h-5 w-5 text-secondary" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const completedCount = sessions.filter(s => s.status === "completed").length;
  const progressPercent = (completedCount / 12) * 100;
  const isGeneratingPdf = generatingPdfMode !== null;

  const handleExportGuide = async (mode: PdfMode = "draft") => {
    if (!project || isGeneratingPdf) return;

    if (mode === "polished" && completedCount === 0) {
      toast.error("No completed sessions yet", {
        description: "Complete at least one meeting before exporting a Strategic Plan.",
      });
      return;
    }

    setGeneratingPdfMode(mode);
    toast.info(
      mode === "polished"
        ? "Synthesizing your Strategic Plan with AI — this can take 20–40 seconds..."
        : "Generating Working Draft..."
    );

    try {
      const [{ data: artifacts }, { data: interrogations }, { data: members }] = await Promise.all([
        supabase
          .from("artifacts")
          .select("*")
          .eq("project_id", projectId!)
          .order("created_at", { ascending: true }),
        supabase
          .from("interrogations")
          .select("*")
          .eq("project_id", projectId!)
          .order("created_at", { ascending: true }),
        supabase
          .from("project_members")
          .select("role, user_id")
          .eq("project_id", projectId!),
      ]);

      // Enrich team members with profile name + email
      let teamMembers: { full_name: string | null; email: string; role: string }[] = [];
      if (members && members.length > 0) {
        const userIds = members.map((m: any) => m.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);
        teamMembers = members.map((m: any) => {
          const p = profiles?.find((x: any) => x.id === m.user_id);
          return {
            full_name: p?.full_name ?? null,
            email: p?.email ?? "",
            role: m.role,
          };
        });
      }

      let narrative: string | undefined;
      if (mode === "polished") {
        const { data: planData, error: planError } = await supabase.functions.invoke(
          "generate-strategic-plan",
          { body: { projectId } }
        );
        if (planError || !planData?.narrative) {
          toast.error("Failed to synthesize Strategic Plan", {
            description: planError?.message || "AI did not return a plan. Please try again.",
          });
          return;
        }
        narrative = planData.narrative as string;
      }

      const preview = await generateProjectPdfPreview(
        project,
        sessions,
        (artifacts || []) as any,
        (interrogations || []) as any,
        mode,
        narrative,
        undefined,
        teamMembers
      );

      setPdfPreview(preview);
      setPdfPreviewOpen(true);
    } catch (error: any) {
      toast.error("Failed to generate PDF", { description: error.message });
      console.error(error);
    } finally {
      setGeneratingPdfMode(null);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectId) return;
    
    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;
      
      toast.success("Project deleted successfully");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error("Failed to delete project");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold">{project.name}</h1>
                <p className="text-muted-foreground mt-1">
                  {project.organizations.name} • {project.organizations.location}
                </p>
              </div>
              <div className="flex gap-2">
                <InviteTeamDialog projectId={project.id} projectName={project.name} />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" disabled={isGeneratingPdf}>
                      {isGeneratingPdf ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <FileText className="mr-2 h-4 w-4" />
                      )}
                      {isGeneratingPdf ? "Preparing..." : "Export Guide"}
                      {!isGeneratingPdf && <ChevronDown className="ml-1 h-3.5 w-3.5 opacity-70" />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72">
                    <DropdownMenuLabel>Choose export type</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleExportGuide("polished")}
                      className="flex flex-col items-start gap-1 py-2.5"
                      disabled={completedCount === 0 || isGeneratingPdf}
                    >
                      <div className="flex items-center gap-2 font-medium">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        Strategic Plan
                      </div>
                      <p className="text-xs text-muted-foreground leading-snug">
                        Polished, publication-ready. Includes executive summary, formatted
                        deliverables, and consolidated action items by phase. Skips
                        unfinished sessions.
                        {completedCount === 0 && " Requires at least one completed meeting."}
                      </p>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleExportGuide("draft")}
                      className="flex flex-col items-start gap-1 py-2.5"
                      disabled={isGeneratingPdf}
                    >
                      <div className="flex items-center gap-2 font-medium">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        Working Draft
                      </div>
                      <p className="text-xs text-muted-foreground leading-snug">
                        Internal binder showing all sessions including pending ones, with
                        progress markers and "up next" cues.
                      </p>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Project
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Project</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{project.name}"? This action cannot be undone
                        and will remove all associated sessions and data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">
                  {completedCount} of 12 sessions completed
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {/* CARE Team */}
          <div className="mb-6">
            <ProjectTeamList projectId={project.id} />
          </div>

          {/* Organization Info */}
          <Card className="p-6 mb-8 shadow-card">
            <h2 className="text-xl font-semibold mb-4">Organization Mission</h2>
            <p className="text-muted-foreground">
              {project.organizations.mission || "No mission statement provided"}
            </p>

            {/* Project Dates */}
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Start:</span>
                <span className="font-medium">
                  {project.start_date
                    ? format(parseISO(project.start_date), "MMM d, yyyy")
                    : "Not set"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">End:</span>
                {project.end_date ? (
                  <span className="font-medium">
                    {format(parseISO(project.end_date), "MMM d, yyyy")}
                  </span>
                ) : (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        Set closing date
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={undefined}
                        onSelect={async (date) => {
                          if (!date) return;
                          const { error } = await supabase
                            .from("projects")
                            .update({ end_date: format(date, "yyyy-MM-dd") })
                            .eq("id", project.id);
                          if (error) {
                            toast.error("Failed to set closing date");
                          } else {
                            setProject({ ...project, end_date: format(date, "yyyy-MM-dd") });
                            toast.success("Closing date saved");
                          }
                        }}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div
                className={cn(
                  "flex items-center gap-3 rounded-md border px-3 py-2 transition-colors",
                  project.data_donation_consent
                    ? "bg-accent/10 border-accent/30"
                    : "bg-muted/40 border-border"
                )}
              >
                <Switch
                  id="data-contribution-toggle"
                  checked={project.data_donation_consent}
                  disabled={updatingConsent}
                  onCheckedChange={handleConsentToggle}
                  aria-label="Toggle Data Contribution"
                />
                <Label
                  htmlFor="data-contribution-toggle"
                  className="text-sm font-medium cursor-pointer select-none"
                >
                  Data Contribution:{" "}
                  <span
                    className={
                      project.data_donation_consent ? "text-accent" : "text-muted-foreground"
                    }
                  >
                    {project.data_donation_consent ? "Active" : "Inactive"}
                  </span>
                </Label>
                {updatingConsent && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                )}
                <DataDonationDialog>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Learn more about Data Contribution"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </DataDonationDialog>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/interrogations/${project.id}`);
                }}
              >
                View Interrogations
              </Button>
            </div>

            <AlertDialog open={confirmRevokeOpen} onOpenChange={setConfirmRevokeOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disable Data Contribution?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Future AI interrogations from this project will no longer be shared
                    with the anti-bias dataset commons. Previously contributed
                    interrogations remain unless you also request their removal. You can
                    re-enable Data Contribution at any time.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Active</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      setConfirmRevokeOpen(false);
                      updateDataConsent(false);
                    }}
                  >
                    Disable Contribution
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Card>


          {/* Sessions by Phase */}
          {[1, 2, 3].map((phase) => {
            const phaseSessions = sessions.filter((s) => {
              if (phase === 1) return s.session_number <= 5;
              if (phase === 2) return s.session_number > 5 && s.session_number <= 10;
              return s.session_number > 10;
            });

            return (
              <div key={phase} className="mb-8">
                <h2 className="text-2xl font-bold mb-4">
                  {getPhase(phaseSessions[0]?.session_number || 1)}
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {phaseSessions.map((session) => (
                    <Card
                      key={session.id}
                      className="p-5 hover:shadow-elevated transition-all cursor-pointer group"
                      onClick={() => navigate(`/session/${session.id}`)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="text-sm text-muted-foreground font-medium mb-1">
                            Meeting {session.session_number}
                          </div>
                          <h3 className="font-semibold group-hover:text-primary transition-colors">
                            {session.session_name}
                          </h3>
                        </div>
                        {getStatusIcon(session.status)}
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          session.status === "completed"
                            ? "bg-accent/10 text-accent border-accent/20"
                            : session.status === "in_progress"
                            ? "bg-secondary/10 text-secondary border-secondary/20"
                            : ""
                        }
                      >
                        {session.status === "completed"
                          ? "Completed"
                          : session.status === "in_progress"
                          ? "In Progress"
                          : "Not Started"}
                      </Badge>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </main>

        <PdfPreviewDialog
          open={pdfPreviewOpen}
          onOpenChange={setPdfPreviewOpen}
          previewData={pdfPreview}
        />
      </div>
    </AuthGuard>
  );
};

export default ProjectDetail;