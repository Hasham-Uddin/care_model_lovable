import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  PlayCircle,
  Eye,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { getSessionContent } from "@/config/sessionContent";

interface Session {
  id: string;
  session_number: number;
  session_name: string;
  status: "not_started" | "in_progress" | "completed";
  completed_at: string | null;
  notes: string | null;
  next_steps: string | null;
  is_completed: boolean;
}

interface Project {
  id: string;
  name: string;
  facilitator_id: string;
  organizations: { name: string; location: string; mission: string };
}

interface Artifact {
  id: string;
  session_id: string;
  content: Record<string, any>;
}

interface Interrogation {
  id: string;
  session_id: string;
  challenge_tags: string[];
  verdict: string | null;
  model_output: string;
  model_revision: string | null;
  user_prompt: string;
}

const MonitorProjectView = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [interrogations, setInterrogations] = useState<Interrogation[]>([]);
  const [facilitator, setFacilitator] = useState<{ email: string; full_name: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      const [projectRes, sessionsRes, artifactsRes, interrogationsRes] = await Promise.all([
        supabase
          .from("projects")
          .select("id, name, facilitator_id, organizations(name, location, mission)")
          .eq("id", projectId!)
          .single(),
        supabase
          .from("sessions")
          .select("*")
          .eq("project_id", projectId!)
          .order("session_number", { ascending: true }),
        supabase
          .from("artifacts")
          .select("id, session_id, content")
          .eq("project_id", projectId!),
        supabase
          .from("interrogations")
          .select("id, session_id, challenge_tags, verdict, model_output, model_revision, user_prompt")
          .eq("project_id", projectId!),
      ]);

      if (projectRes.error) throw projectRes.error;
      setProject(projectRes.data as any);
      setSessions((sessionsRes.data || []) as any);
      setArtifacts((artifactsRes.data || []) as any);
      setInterrogations((interrogationsRes.data || []) as any);

      // Fetch facilitator profile
      if (projectRes.data?.facilitator_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", projectRes.data.facilitator_id)
          .single();
        setFacilitator(profile);
      }
    } catch (error: any) {
      toast.error("Failed to load project data");
      console.error(error);
    } finally {
      setLoading(false);
    }
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

  const getSessionArtifact = (sessionId: string) =>
    artifacts.find((a) => a.session_id === sessionId);

  const getSessionInterrogations = (sessionId: string) =>
    interrogations.filter((i) => i.session_id === sessionId);

  const completedCount = sessions.filter((s) => s.status === "completed").length;
  const progressPercent = sessions.length > 0 ? (completedCount / sessions.length) * 100 : 0;

  const getQualityScore = (session: Session) => {
    const artifact = getSessionArtifact(session.id);
    const intrs = getSessionInterrogations(session.id);
    let score = 0;
    let total = 0;

    // Session started (has status beyond not_started)
    total++;
    if (session.status !== "not_started") score++;

    // Has notes
    total++;
    if (session.notes?.trim()) score++;

    // Has next steps
    total++;
    if (session.next_steps?.trim()) score++;

    // Worksheet inputs filled
    if (artifact?.content) {
      const content = artifact.content as Record<string, any>;
      const inputKeys = Object.keys(content).filter(k => k.startsWith("input"));
      const filled = inputKeys.filter(k => content[k]?.toString().trim());
      total += Math.max(inputKeys.length, 2);
      score += filled.length;

      // AI response generated
      total++;
      if (content.ai_response) score++;

      // Refined output
      total++;
      if (content.refined) score++;
    } else {
      total += 4; // worksheet + AI + refined baseline
    }

    // Interrogation completed
    total++;
    if (intrs.length > 0) score++;

    // Session completed
    total++;
    if (session.status === "completed") score++;

    return total > 0 ? Math.round((score / total) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/monitor")} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Monitor Dashboard
          </Button>
          <div className="flex items-center gap-2 mb-1">
            <Eye className="h-5 w-5 text-primary" />
            <Badge variant="outline" className="text-xs">Read-Only</Badge>
          </div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground mt-1">
            {(project.organizations as any)?.name} • {(project.organizations as any)?.location}
          </p>
          {facilitator && (
            <p className="text-sm text-muted-foreground mt-1">
              Facilitator: {facilitator.full_name || facilitator.email}
            </p>
          )}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">
                {completedCount} of {sessions.length} sessions completed
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-4">
        {/* Organization Mission */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-2">Organization Mission</h2>
          <p className="text-muted-foreground">
            {(project.organizations as any)?.mission || "No mission statement provided"}
          </p>
        </Card>

        {/* Sessions */}
        {sessions.map((session) => {
          const isExpanded = expandedSession === session.id;
          const artifact = getSessionArtifact(session.id);
          const intrs = getSessionInterrogations(session.id);
          const quality = getQualityScore(session);
          const content = getSessionContent(session.session_number);

          return (
            <Card key={session.id} className="overflow-hidden">
              {/* Session Header */}
              <button
                className="w-full p-5 flex items-center justify-between hover:bg-muted/30 transition-colors text-left"
                onClick={() => setExpandedSession(isExpanded ? null : session.id)}
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(session.status)}
                  <div>
                    <p className="text-sm text-muted-foreground">Meeting {session.session_number}</p>
                    <p className="font-semibold">{session.session_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-muted-foreground">Quality</p>
                    <p className={`text-sm font-bold ${quality >= 80 ? "text-accent" : quality >= 50 ? "text-secondary" : "text-muted-foreground"}`}>
                      {quality}%
                    </p>
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
                    {session.status === "completed" ? "Completed" : session.status === "in_progress" ? "In Progress" : "Not Started"}
                  </Badge>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-border/50 p-5 space-y-5 bg-muted/10">
                  {/* Worksheet Responses */}
                  {artifact?.content && (
                    <div>
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Worksheet Responses
                      </h3>
                      <div className="space-y-3">
                        {content?.guideQuestions && Object.entries(content.guideQuestions).map(([key, input]) => {
                          const value = (artifact.content as any)[key];
                          return (
                            <div key={key} className="bg-card rounded-lg p-3 border border-border/50">
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                {input.label}
                              </p>
                              <p className="text-sm whitespace-pre-wrap">
                                {value || <span className="italic text-muted-foreground">Not filled</span>}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* AI Response */}
                  {artifact?.content?.ai_response && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2">AI Co-Facilitator Response</h3>
                      <div className="bg-card rounded-lg p-3 border border-border/50">
                        <p className="text-sm whitespace-pre-wrap">{(artifact.content as any).ai_response}</p>
                      </div>
                    </div>
                  )}

                  {/* Refined Output */}
                  {artifact?.content?.refined && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2">Refined Output</h3>
                      <div className="bg-accent/5 rounded-lg p-3 border border-accent/20">
                        <p className="text-sm whitespace-pre-wrap">{(artifact.content as any).refined}</p>
                      </div>
                    </div>
                  )}

                  {/* Interrogations */}
                  {intrs.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2">TIR Interrogations ({intrs.length})</h3>
                      <div className="space-y-2">
                        {intrs.map((intr) => (
                          <div key={intr.id} className="bg-card rounded-lg p-3 border border-border/50">
                            <div className="flex flex-wrap gap-1 mb-2">
                              {(intr.challenge_tags || []).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag.replace(/_/g, " ")}
                                </Badge>
                              ))}
                              {intr.verdict && (
                                <Badge
                                  className={`text-xs ${
                                    intr.verdict === "accept_revision"
                                      ? "bg-accent/10 text-accent"
                                      : intr.verdict === "reject_provide_human"
                                      ? "bg-destructive/10 text-destructive"
                                      : "bg-secondary/10 text-secondary"
                                  }`}
                                >
                                  {intr.verdict.replace(/_/g, " ")}
                                </Badge>
                              )}
                            </div>
                            {intr.model_revision && (
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {intr.model_revision}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next Steps */}
                  {session.next_steps && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2">Next Steps</h3>
                      <div className="bg-card rounded-lg p-3 border border-border/50">
                        <p className="text-sm whitespace-pre-wrap">{session.next_steps}</p>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {session.notes && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2">Session Notes</h3>
                      <div className="bg-card rounded-lg p-3 border border-border/50">
                        <p className="text-sm whitespace-pre-wrap">{session.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {!artifact?.content && intrs.length === 0 && !session.notes && !session.next_steps && (
                    <p className="text-sm text-muted-foreground italic text-center py-4">
                      No content has been added to this session yet.
                    </p>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </main>
    </div>
  );
};

export default MonitorProjectView;
