import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, CheckCircle2, Info, Target, Lightbulb, Mail, Copy, Download, Play, FileText, Sparkles, AlertTriangle, NotebookPen, Send, BookOpen, Clock, History } from "lucide-react";
import { toast } from "sonner";
import { AuthGuard } from "@/components/AuthGuard";
import { AiCoFacilitator } from "@/components/session/AiCoFacilitator";
import { InterrogationPanel } from "@/components/session/InterrogationPanel";
import { VideoTutorial } from "@/components/session/VideoTutorial";
import { WorkflowStepper } from "@/components/session/WorkflowStepper";
import { StepCard } from "@/components/session/StepCard";
import { PreviousSessionReference } from "@/components/session/PreviousSessionReference";
import { AiConsentGate } from "@/components/AiConsentGate";
import { getSessionContent, MEETING_VIDEOS } from "@/config/sessionContent";
import { AiLiteracySurvey } from "@/components/session/AiLiteracySurvey";
import { IcebreakerActivity } from "@/components/session/IcebreakerActivity";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface Session {
  id: string;
  session_number: number;
  session_name: string;
  status: "not_started" | "in_progress" | "completed";
  notes: string | null;
  next_steps: string | null;
  is_completed: boolean;
  project_id: string;
}

interface PreviousSessionDebrief {
  next_steps: string | null;
  notes: string | null;
  session_name: string;
  session_number: number;
}

const SessionDetail = () => {
  const { sessionId } = useParams();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [worksheetData, setWorksheetData] = useState<any>({});
  const [previousSessionData, setPreviousSessionData] = useState<Record<string, string> | null>(null);
  const [previousSessionNumber, setPreviousSessionNumber] = useState<number | null>(null);
  const [previousDebrief, setPreviousDebrief] = useState<PreviousSessionDebrief | null>(null);
  const [nextSteps, setNextSteps] = useState("");
  const [showInterrogation, setShowInterrogation] = useState(false);
  const [interrogationData, setInterrogationData] = useState({
    output: "",
    prompt: "",
  });
  const [generatingEmail, setGeneratingEmail] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState("");
  const navigate = useNavigate();
  const [injectedPrompt, setInjectedPrompt] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const savedDataRef = useRef<string>("");
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const sessionContent = session ? getSessionContent(session.session_number) : null;

  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(worksheetData) !== savedDataRef.current;
  }, [worksheetData]);

  // Compute current workflow step for the stepper.
  // Start at step 1 (Watch Tutorial) so the stepper doesn't falsely render
  // step 1 as "complete" before the user has done anything.
  const currentStep = useMemo<number>(() => {
    const hasInput = !!(worksheetData.input1?.trim() || worksheetData.input2?.trim() || worksheetData.input3?.trim());
    const hasAi = !!worksheetData.ai_response;
    const hasRefined = !!worksheetData.refined;
    if (hasRefined) return 5;
    if (hasAi) return 4;
    if (hasInput) return 3;
    return 1; // Default: start on the tutorial step
  }, [worksheetData]);

  useEffect(() => {
    if (sessionId) {
      fetchSessionData();
    }
  }, [sessionId]);

  const fetchSessionData = async () => {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (error) throw error;
      setSession(data);
      setNextSteps(data.next_steps || "");

      // Fetch previous session debrief (for any session > 1)
      if (data.session_number > 1) {
        const { data: prevSession } = await supabase
          .from("sessions")
          .select("id, session_name, session_number, next_steps, notes")
          .eq("project_id", data.project_id)
          .eq("session_number", data.session_number - 1)
          .maybeSingle();

        if (prevSession) {
          setPreviousDebrief({
            next_steps: prevSession.next_steps,
            notes: prevSession.notes,
            session_name: prevSession.session_name,
            session_number: prevSession.session_number,
          });
        }
      }
      
      const { data: artifacts } = await supabase
        .from("artifacts")
        .select("*")
        .eq("session_id", sessionId);

      if (artifacts && artifacts.length > 0) {
        const combined = artifacts.reduce((acc: any, art: any) => {
          return { ...acc, ...(art.content || {}) };
        }, {});
        setWorksheetData(combined);
        savedDataRef.current = JSON.stringify(combined);
      }

      // Fetch previous session data for cross-session reference (e.g., session 9 references session 8)
      const CROSS_SESSION_MAP: Record<number, number> = { 9: 8 };
      const prevSessionNum = CROSS_SESSION_MAP[data.session_number];
      if (prevSessionNum) {
        setPreviousSessionNumber(prevSessionNum);
        const { data: prevSession } = await supabase
          .from("sessions")
          .select("id")
          .eq("project_id", data.project_id)
          .eq("session_number", prevSessionNum)
          .maybeSingle();

        if (prevSession) {
          const { data: prevArtifacts } = await supabase
            .from("artifacts")
            .select("*")
            .eq("session_id", prevSession.id);

          if (prevArtifacts && prevArtifacts.length > 0) {
            const prevCombined = prevArtifacts.reduce((acc: any, art: any) => {
              return { ...acc, ...art.content };
            }, {});
            setPreviousSessionData(prevCombined);
          }
        }
      }
    } catch (error: any) {
      toast.error("Failed to load session");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Core save logic (shared by manual and auto-save)
  const performSave = useCallback(async (silent = false): Promise<boolean> => {
    if (!session) return false;

    try {
      const { data: existingArtifact } = await supabase
        .from("artifacts")
        .select("id")
        .eq("session_id", session.id)
        .eq("project_id", session.project_id)
        .maybeSingle();

      let artifactError;
      if (existingArtifact) {
        const { error } = await supabase
          .from("artifacts")
          .update({ content: worksheetData as any, updated_at: new Date().toISOString() })
          .eq("id", existingArtifact.id);
        artifactError = error;
      } else {
        const { error } = await supabase
          .from("artifacts")
          .insert({
            project_id: session.project_id,
            session_id: session.id,
            artifact_type: getArtifactType(session.session_number) as any,
            content: worksheetData as any,
            ai_generated: false,
          });
        artifactError = error;
      }

      if (artifactError) throw artifactError;

      await supabase
        .from("sessions")
        .update({ status: "in_progress", next_steps: nextSteps.trim() || null })
        .eq("id", session.id);

      savedDataRef.current = JSON.stringify(worksheetData);
      setLastSaved(new Date());
      return true;
    } catch (error: any) {
      if (!silent) {
        toast.error("Failed to save", { description: error.message });
      }
      console.error("Save error:", error);
      return false;
    }
  }, [session, worksheetData, nextSteps]);

  // Manual save (with toast feedback)
  const handleSave = async () => {
    setSaving(true);
    const success = await performSave(false);
    if (success) {
      toast.success("Progress saved!");
    }
    setSaving(false);
  };

  // Auto-save: debounce 3 seconds after worksheet changes
  useEffect(() => {
    if (!session || loading) return;
    if (JSON.stringify(worksheetData) === savedDataRef.current) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      setAutoSaving(true);
      await performSave(true);
      setAutoSaving(false);
    }, 3000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [worksheetData, session, loading, performSave]);

  // Warn on unsaved changes when leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleMarkComplete = async () => {
    if (!session) return;
    if (!nextSteps.trim()) {
      toast.error("Please fill in the Next Steps before completing the session.");
      return;
    }
    setSaving(true);

    try {
      // Cancel any pending debounced autosave so it can't overwrite state
      // moments after we mark the session done.
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }

      // Persist the latest worksheet/refined/notes BEFORE flipping the
      // session to completed. Otherwise edits made in the last 3 seconds
      // (the autosave debounce window) are silently lost.
      const saved = await performSave(true);
      if (!saved) {
        toast.error("Couldn't save your latest changes — please try again.");
        return;
      }

      const { error } = await supabase
        .from("sessions")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          next_steps: nextSteps.trim(),
          is_completed: true,
        })
        .eq("id", session.id);

      if (error) throw error;

      toast.success("Session marked as complete!");
      navigate(`/project/${session.project_id}`);
    } catch (error: any) {
      toast.error("Failed to complete session");
    } finally {
      setSaving(false);
    }
  };

  const getArtifactType = (sessionNum: number): string => {
    const typeMap: Record<number, string> = {
      1: "problem_statement", 2: "community_group", 3: "timeline_event",
      4: "invested_party", 5: "dataset", 6: "asset_map", 7: "solution",
      8: "toc_node", 9: "toc_node", 10: "cim_metric", 11: "data_plan", 12: "solution",
    };
    return typeMap[sessionNum] || "solution";
  };

  const handleAiResponse = (response: string) => {
    // ALWAYS store the AI output in `ai_response`. The previous "first empty
    // key" heuristic could clobber an unfilled worksheet input (e.g. input2)
    // with AI-generated text, destroying the worksheet structure.
    setWorksheetData((prev: any) => ({ ...prev, ai_response: response }));
  };

  const handleInterrogateClick = (output: string, prompt: string) => {
    setInterrogationData({ output, prompt });
    setShowInterrogation(true);
  };

  const handleRefinedOutput = (refinedOutput: string) => {
    setWorksheetData((prev: any) => ({ ...prev, refined: refinedOutput }));
  };

  const handleGenerateEmail = async () => {
    if (!session) return;
    setGeneratingEmail(true);

    try {
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select(`*, organization:organizations(*)`)
        .eq("id", session.project_id)
        .single();

      if (projectError) throw projectError;

      const { data: artifacts, error: artifactsError } = await supabase
        .from("artifacts")
        .select("*")
        .eq("session_id", session.id);

      if (artifactsError) throw artifactsError;

      const { data: interrogations, error: interrogationsError } = await supabase
        .from("interrogations")
        .select("*")
        .eq("session_id", session.id);

      if (interrogationsError) throw interrogationsError;

      const { data, error } = await supabase.functions.invoke("generate-session-email", {
        body: {
          sessionData: session,
          projectData,
          artifacts: artifacts || [],
          interrogations: interrogations || [],
        },
      });

      if (error) throw error;

      setGeneratedEmail(data.emailContent);
      setShowEmailDialog(true);
      toast.success("Wrap-up email generated!");
    } catch (error: any) {
      toast.error("Failed to generate email", { description: error.message });
      console.error(error);
    } finally {
      setGeneratingEmail(false);
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(generatedEmail);
    toast.success("Email copied to clipboard!");
  };

  const handleDownloadEmail = () => {
    const blob = new Blob([generatedEmail], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${session?.session_name.replace(/\s+/g, "-")}-wrap-up-email.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Email downloaded!");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Session not found</p>
      </div>
    );
  }

  const hasWorksheetData = !!(worksheetData.input1?.trim() || worksheetData.input2?.trim() || worksheetData.input3?.trim());
  const hasAiResponse = !!worksheetData.ai_response;
  const hasRefinedOutput = !!worksheetData.refined;

  return (
    <AuthGuard>
      <AiLiteracySurvey sessionNumber={session.session_number} projectId={session.project_id} />
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <Button
              variant="ghost"
              onClick={() => navigate(`/project/${session.project_id}`)}
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Project
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{session.session_name}</h1>
                  <Badge
                    variant={session.status === "completed" ? "default" : "outline"}
                  >
                    Meeting {session.session_number}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  {session.status === "completed"
                    ? "Completed"
                    : session.status === "in_progress"
                    ? "In Progress"
                    : "Not Started"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleGenerateEmail} 
                  disabled={generatingEmail || session.status === "not_started"}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {generatingEmail ? "Generating..." : "Generate Wrap-Up Email"}
                </Button>
                {/* Auto-save indicator */}
                {(lastSaved || autoSaving) && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {autoSaving ? "Auto-saving..." : lastSaved ? `Last saved ${lastSaved.toLocaleTimeString()}` : null}
                  </span>
                )}
                {hasUnsavedChanges && !autoSaving && (
                  <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                    Unsaved changes
                  </Badge>
                )}
                <Button variant="outline" onClick={handleSave} disabled={saving || autoSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save Progress"}
                </Button>
                <Button onClick={handleMarkComplete} disabled={saving || !nextSteps.trim()} title={!nextSteps.trim() ? "Fill in Next Steps before completing" : ""}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark Complete
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Workflow Stepper */}
        <div className="container mx-auto px-4 py-4">
          <Card className="p-4 shadow-sm border-border/50 bg-card/80 backdrop-blur-sm">
            <WorkflowStepper
              currentStep={currentStep}
              hasWorksheetData={hasWorksheetData}
              hasAiResponse={hasAiResponse}
              hasRefinedOutput={hasRefinedOutput}
            />
          </Card>
        </div>

        {/* Main Content */}
        <main className="container mx-auto px-4 pb-8">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column: Step-by-step guided sections */}
            <div className="lg:col-span-2 space-y-6">
              {/* Previous Session Debrief */}
              {previousDebrief && (
                <Card className="p-5 border-primary/20 bg-primary/[0.02]">
                  <div className="flex items-center gap-2 mb-3">
                    <History className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-base">Previous Session Debrief</h3>
                    <Badge variant="outline" className="text-xs">Meeting {previousDebrief.session_number}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Summary and next steps from <strong>{previousDebrief.session_name}</strong>
                  </p>
                  {previousDebrief.next_steps?.trim() ? (
                    <div className="mb-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-primary mb-1.5 flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5" />
                        Next Steps from Previous Session
                      </h4>
                      <div className="bg-primary/5 border border-primary/15 rounded-lg p-3 text-sm whitespace-pre-wrap leading-relaxed">
                        {previousDebrief.next_steps}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No next steps were recorded for the previous session.</p>
                  )}
                  {previousDebrief.notes?.trim() && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                        <NotebookPen className="w-3.5 h-3.5" />
                        Session Notes
                      </h4>
                      <div className="bg-muted/50 border border-border/50 rounded-lg p-3 text-sm whitespace-pre-wrap leading-relaxed">
                        {previousDebrief.notes}
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {/* ICE BREAKER (before tutorial) */}
              {session && (
                <IcebreakerActivity meetingNumber={session.session_number} />
              )}

              {/* STEP 1: Video Tutorial */}
              {session && MEETING_VIDEOS[session.session_number] && sessionContent && (
                <StepCard
                  stepNumber={1}
                  title="Watch the Tutorial"
                  hint="Start here — this short video walks you through what to do in this meeting."
                  icon={Play}
                  isComplete={currentStep > 1}
                  isActive={currentStep <= 1}
                >
                  <VideoTutorial
                    videoUrl={MEETING_VIDEOS[session.session_number]}
                    meetingNumber={session.session_number}
                    title={sessionContent.title}
                  />
                </StepCard>
              )}

              {/* Cross-Session Reference (e.g., Session 9 shows Session 8 outputs) */}
              {previousSessionNumber !== null && (
                <PreviousSessionReference
                  previousSessionName={getSessionContent(previousSessionNumber)?.title || `Meeting ${previousSessionNumber}`}
                  previousSessionNumber={previousSessionNumber}
                  data={previousSessionData || {}}
                  guideLabels={{
                    input1: getSessionContent(previousSessionNumber)?.guideQuestions.input1.label,
                    input2: getSessionContent(previousSessionNumber)?.guideQuestions.input2.label,
                    input3: getSessionContent(previousSessionNumber)?.guideQuestions.input3?.label,
                  }}
                />
              )}

              {/* STEP 2: Session Overview + Worksheet */}
              <StepCard
                stepNumber={2}
                title="Fill Out the Worksheet"
                hint="Answer the guide questions below using your community's voice and knowledge. This is the foundation for everything that follows."
                icon={FileText}
                isComplete={hasWorksheetData}
                isActive={currentStep === 2}
              >
                {/* Session Overview (collapsible context) */}
                {sessionContent && (
                  <details className="mb-6 group" open>
                    <summary className="cursor-pointer flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-3">
                      <Info className="w-4 h-4" />
                      <span>Session Guide & Objectives</span>
                      <span className="text-xs ml-auto group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-lg p-4 space-y-3">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {sessionContent.description}
                      </p>
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <Target className="w-3.5 h-3.5 text-primary" />
                          <h4 className="font-semibold text-xs uppercase tracking-wider">Objectives</h4>
                        </div>
                        <ul className="space-y-1 ml-5">
                          {sessionContent.objectives.map((obj, idx) => (
                            <li key={idx} className="text-xs text-muted-foreground">• {obj}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <Lightbulb className="w-3.5 h-3.5 text-primary" />
                          <h4 className="font-semibold text-xs uppercase tracking-wider">Tips</h4>
                        </div>
                        <ul className="space-y-1 ml-5">
                          {sessionContent.tips.map((tip, idx) => (
                            <li key={idx} className="text-xs text-muted-foreground">• {tip}</li>
                          ))}
                        </ul>
                      </div>
                      {sessionContent.examples && sessionContent.examples.length > 0 && (
                        <div className="pt-2 border-t border-border/50">
                          <h4 className="font-semibold text-xs uppercase tracking-wider mb-1.5">Examples</h4>
                          {sessionContent.examples.map((ex, idx) => (
                            <p key={idx} className="text-xs text-muted-foreground italic bg-background/50 p-2 rounded">{ex}</p>
                          ))}
                        </div>
                      )}
                      {sessionContent.keyTerms && sessionContent.keyTerms.length > 0 && (
                        <div className="pt-2 border-t border-border/50">
                          <div className="flex items-center gap-2 mb-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-primary" />
                            <h4 className="font-semibold text-xs uppercase tracking-wider">Key Terms</h4>
                          </div>
                          <div className="space-y-2">
                            {sessionContent.keyTerms.map((kt, idx) => (
                              <div key={idx} className="text-xs bg-background/50 p-2 rounded">
                                <span className="font-semibold text-foreground">{kt.term}:</span>{" "}
                                <span className="text-muted-foreground">{kt.definition}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </details>
                )}

                {/* Worksheet Fields */}
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="input1" className="text-base font-semibold mb-1">
                      {sessionContent?.guideQuestions.input1.label || "Primary Input"}
                    </Label>
                    {sessionContent?.guideQuestions.input1.helpText && (
                      <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                        {sessionContent.guideQuestions.input1.helpText}
                      </p>
                    )}
                    <Textarea
                      id="input1"
                      value={worksheetData.input1 || ""}
                      onChange={(e) =>
                        setWorksheetData((prev: any) => ({ ...prev, input1: e.target.value }))
                      }
                      rows={5}
                      placeholder={sessionContent?.guideQuestions.input1.placeholder || "Enter your initial thoughts..."}
                      className="resize-none"
                    />
                  </div>
                  <div>
                    <Label htmlFor="input2" className="text-base font-semibold mb-1">
                      {sessionContent?.guideQuestions.input2.label || "Additional Context"}
                    </Label>
                    {sessionContent?.guideQuestions.input2.helpText && (
                      <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                        {sessionContent.guideQuestions.input2.helpText}
                      </p>
                    )}
                    <Textarea
                      id="input2"
                      value={worksheetData.input2 || ""}
                      onChange={(e) =>
                        setWorksheetData((prev: any) => ({ ...prev, input2: e.target.value }))
                      }
                      rows={5}
                      placeholder={sessionContent?.guideQuestions.input2.placeholder || "Provide context..."}
                      className="resize-none"
                    />
                  </div>

                  {/* Optional third input */}
                  {sessionContent?.guideQuestions.input3 && (
                    <div>
                      <Label htmlFor="input3" className="text-base font-semibold mb-1">
                        {sessionContent.guideQuestions.input3.label}
                      </Label>
                      {sessionContent.guideQuestions.input3.helpText && (
                        <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                          {sessionContent.guideQuestions.input3.helpText}
                        </p>
                      )}
                      <Textarea
                        id="input3"
                        value={worksheetData.input3 || ""}
                        onChange={(e) =>
                          setWorksheetData((prev: any) => ({ ...prev, input3: e.target.value }))
                        }
                        rows={5}
                        placeholder={sessionContent.guideQuestions.input3.placeholder}
                        className="resize-none"
                      />
                    </div>
                  )}

                  {/* Send to AI button */}
                  {hasWorksheetData && (
                    <Button
                      variant="default"
                      className="w-full"
                      onClick={() => {
                        const combined = [
                          worksheetData.input1 || "",
                          worksheetData.input2 || "",
                          worksheetData.input3 || "",
                        ].filter(Boolean).join("\n\n");
                        setInjectedPrompt(combined);
                        toast.success("Worksheet sent to AI Co-Facilitator →", {
                          description: "Scroll to the AI panel on the right to generate a response.",
                        });
                      }}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Send to AI Co-Facilitator
                    </Button>
                  )}

                  {/* Inline prompt to move to next step */}
                  {hasWorksheetData && !hasAiResponse && (
                    <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm text-primary">
                      <Sparkles className="w-4 h-4 flex-shrink-0" />
                      <span>Click <strong>"Send to AI Co-Facilitator"</strong> above to auto-fill and generate insights →</span>
                    </div>
                  )}
                </div>
              </StepCard>

              {/* STEP 4-5: Refined Output & Notes */}
              <StepCard
                stepNumber={5}
                title="Review & Save"
                hint="Review the refined output, add session notes, then save your progress."
                icon={Save}
                isComplete={session.status === "completed" || (hasRefinedOutput && !!nextSteps.trim())}
                isActive={currentStep >= 5 && session.status !== "completed"}
              >
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="refined" className="text-base font-semibold mb-1">
                      Refined Output
                    </Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      {hasRefinedOutput
                        ? "This was generated after community interrogation. Edit below or keep as-is."
                        : "This will be populated after you interrogate the AI output (Steps 3-4)."}
                    </p>

                    {/* Formatted display of refined output */}
                    {hasRefinedOutput && (
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-3 space-y-2">
                        {worksheetData.refined
                          .split("\n")
                          .filter((line: string) => line.trim())
                          .map((line: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-2 text-sm">
                              {line.trim().startsWith("•") || line.trim().startsWith("-") ? (
                                <span>{line.trim()}</span>
                              ) : (
                                <span>• {line.trim()}</span>
                              )}
                            </div>
                          ))}
                      </div>
                    )}

                    <Textarea
                      id="refined"
                      value={worksheetData.refined || ""}
                      onChange={(e) =>
                        setWorksheetData((prev: any) => ({ ...prev, refined: e.target.value }))
                      }
                      rows={6}
                      placeholder="Final version after AI assistance and community interrogation..."
                      className="resize-none"
                    />
                  </div>

                  {worksheetData.ai_response && (
                    <div className="pt-4 border-t border-border/50">
                      <Label>AI Generated Response (from Step 3)</Label>
                      <div className="mt-2 p-4 bg-accent/5 border border-accent/20 rounded-lg text-sm">
                        {worksheetData.ai_response}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <NotebookPen className="w-4 h-4 text-muted-foreground" />
                      <Label className="text-base font-semibold">Session Notes</Label>
                    </div>
                    <Textarea
                      value={worksheetData.notes || ""}
                      onChange={(e) =>
                        setWorksheetData((prev: any) => ({ ...prev, notes: e.target.value }))
                      }
                      rows={4}
                      placeholder="Capture key discussion points, decisions, and action items..."
                    />
                  </div>

                  {/* Next Steps (mandatory for completion) */}
                  <div className="pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-primary" />
                      <Label className="text-base font-semibold">Next Steps</Label>
                      <Badge variant="outline" className="text-xs border-destructive/50 text-destructive">Required</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      What should happen before the next session? This will appear as a debrief at the top of the next meeting.
                    </p>
                    <Textarea
                      value={nextSteps}
                      onChange={(e) => setNextSteps(e.target.value)}
                      rows={4}
                      placeholder="List action items, follow-ups, and preparation needed for the next session..."
                      className={!nextSteps.trim() ? "border-destructive/30 focus-visible:ring-destructive/30" : ""}
                    />
                    {!nextSteps.trim() && (
                      <p className="text-xs text-destructive mt-1">
                        You must fill in Next Steps before marking this session complete.
                      </p>
                    )}
                  </div>
                </div>
              </StepCard>
            </div>

            {/* Right Column: AI Panel (Steps 3-4) */}
            <div className="lg:col-span-1 space-y-4">
              <StepCard
                stepNumber={3}
                title="AI Co-Facilitator"
                hint="Paste your worksheet content into the AI prompt, then click Generate. After reviewing the response, click 'Interrogate with TIR' to check for bias (Step 4)."
                icon={Sparkles}
                isComplete={hasAiResponse}
                isActive={currentStep === 3 || currentStep === 4}
                className="sticky top-28"
              >
                <AiConsentGate>
                  <AiCoFacilitator
                    sessionType={getArtifactType(session.session_number)}
                    sessionNumber={session.session_number}
                    context={worksheetData}
                    onResponseGenerated={handleAiResponse}
                    onInterrogateClick={handleInterrogateClick}
                    injectedPrompt={injectedPrompt}
                  />
                </AiConsentGate>
              </StepCard>
            </div>
          </div>
        </main>
      </div>

      {/* Interrogation Panel Modal (Step 4) */}
      {showInterrogation && (
        <InterrogationPanel
          output={interrogationData.output}
          userPrompt={interrogationData.prompt}
          sessionId={session.id}
          projectId={session.project_id}
          sessionNumber={session.session_number}
          additionalContext={worksheetData.additional_context}
          onClose={() => setShowInterrogation(false)}
          onRefinedOutput={handleRefinedOutput}
        />
      )}

      {/* Wrap-Up Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Session Wrap-Up Email
            </DialogTitle>
            <DialogDescription>
              Share this email with participants to celebrate their work and explain data contribution.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg border border-border">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {generatedEmail}
              </pre>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleCopyEmail}>
                <Copy className="mr-2 h-4 w-4" />
                Copy to Clipboard
              </Button>
              <Button onClick={handleDownloadEmail}>
                <Download className="mr-2 h-4 w-4" />
                Download as Text
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AuthGuard>
  );
};

export default SessionDetail;
