import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, AlertTriangle, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { AuthGuard } from "@/components/AuthGuard";

interface Interrogation {
  id: string;
  mode: string;
  challenge_tags: string[];
  affected_groups: string[];
  model_output: string;
  model_revision: string | null;
  user_prompt: string;
  context_artifacts: any;
  verdict: string | null;
  created_at: string;
}

const InterrogationDashboard = () => {
  const { projectId } = useParams();
  const [interrogations, setInterrogations] = useState<Interrogation[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (projectId) {
      fetchInterrogations();
    }
  }, [projectId]);

  const fetchInterrogations = async () => {
    try {
      const { data, error } = await supabase
        .from("interrogations")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInterrogations(data || []);
    } catch (error: any) {
      toast.error("Failed to load interrogations");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSONL = async () => {
    try {
      // Format as LLM training data: instruction-following format
      const jsonlData = interrogations
        .map((i) => {
          const tirFeedback = i.context_artifacts || {};
          const feedbackParts = [];
          
          if (tirFeedback.proximity_answer) {
            feedbackParts.push(`PROXIMITY: ${tirFeedback.proximity_answer}`);
          }
          if (tirFeedback.belief_answer) {
            feedbackParts.push(`BELIEF: ${tirFeedback.belief_answer}`);
          }
          if (tirFeedback.timing_answer) {
            feedbackParts.push(`TIMING: ${tirFeedback.timing_answer}`);
          }

          return JSON.stringify({
            messages: [
              {
                role: "system",
                content: "You are a community-centered AI assistant trained to avoid bias, deficit framing, and cultural misrepresentation. You center marginalized voices and use asset-based framing."
              },
              {
                role: "user",
                content: i.user_prompt
              },
              {
                role: "assistant",
                content: i.model_output,
                metadata: {
                  flagged_for: i.challenge_tags,
                  affected_groups: i.affected_groups
                }
              },
              {
                role: "user",
                content: `Community feedback using TIR framework:\n${feedbackParts.join('\n\n')}\n\nPlease provide a refined response that addresses these concerns.`
              },
              {
                role: "assistant",
                content: i.model_revision || "No refined output generated"
              }
            ],
            metadata: {
              interrogation_id: i.id,
              mode: i.mode,
              challenge_tags: i.challenge_tags,
              affected_groups: i.affected_groups,
              timestamp: i.created_at
            }
          });
        })
        .join("\n");

      const blob = new Blob([jsonlData], { type: "application/jsonl" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `llm-training-data-${projectId}-${Date.now()}.jsonl`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Training data exported as JSONL!");
    } catch (error: any) {
      toast.error("Failed to export data");
      console.error(error);
    }
  };

  const handleExportCSV = async () => {
    try {
      // CSV headers
      const headers = [
        "timestamp",
        "mode",
        "challenge_tags",
        "affected_groups",
        "original_prompt",
        "original_output",
        "proximity_feedback",
        "belief_feedback",
        "timing_feedback",
        "refined_output"
      ];

      // CSV rows
      const rows = interrogations.map((i) => {
        const tirFeedback = i.context_artifacts || {};
        return [
          new Date(i.created_at).toISOString(),
          i.mode,
          `"${i.challenge_tags.join('; ')}"`,
          `"${i.affected_groups.join('; ')}"`,
          `"${(i.user_prompt || '').replace(/"/g, '""')}"`,
          `"${(i.model_output || '').replace(/"/g, '""')}"`,
          `"${(tirFeedback.proximity_answer || '').replace(/"/g, '""')}"`,
          `"${(tirFeedback.belief_answer || '').replace(/"/g, '""')}"`,
          `"${(tirFeedback.timing_answer || '').replace(/"/g, '""')}"`,
          `"${(i.model_revision || '').replace(/"/g, '""')}"`
        ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `llm-training-data-${projectId}-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Training data exported as CSV!");
    } catch (error: any) {
      toast.error("Failed to export data");
      console.error(error);
    }
  };

  const getModeColor = (mode: string) => {
    const colors: Record<string, string> = {
      proximity: "bg-primary/10 text-primary border-primary/20",
      belief: "bg-secondary/10 text-secondary border-secondary/20",
      timing: "bg-accent/10 text-accent border-accent/20",
    };
    return colors[mode] || "";
  };

  const getTagCounts = () => {
    const counts: Record<string, number> = {};
    interrogations.forEach((i) => {
      i.challenge_tags.forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const topTags = getTagCounts();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <Button
              variant="ghost"
              onClick={() => navigate(`/project/${projectId}`)}
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Project
            </Button>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold">Interrogation Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                  AI Bias Challenges & Training Data
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleExportCSV} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                <Button onClick={handleExportJSONL} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export JSONL
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 shadow-card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Challenges
                  </p>
                  <p className="text-3xl font-bold">{interrogations.length}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 shadow-card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-secondary to-accent flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Unique Tags</p>
                  <p className="text-3xl font-bold">{topTags.length}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 shadow-card">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Top Tags</p>
                <div className="space-y-1">
                  {topTags.slice(0, 3).map(([tag, count]) => (
                    <div
                      key={tag}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="font-medium">{tag}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Interrogations List */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Challenge History</h2>
            {interrogations.length === 0 ? (
              <Card className="p-12 text-center shadow-card">
                <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No challenges submitted yet. Use the AI Co-Facilitator in
                  sessions to generate outputs, then click "Interrogate" to
                  challenge them.
                </p>
              </Card>
            ) : (
              interrogations.map((interrogation) => (
                <Card key={interrogation.id} className="p-6 shadow-card">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex gap-2">
                      <Badge
                        variant="outline"
                        className={getModeColor(interrogation.mode)}
                      >
                        {interrogation.mode}
                      </Badge>
                      {interrogation.challenge_tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(interrogation.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Model Output:</p>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      {interrogation.model_output.substring(0, 200)}
                      {interrogation.model_output.length > 200 && "..."}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Affected Groups:</p>
                    <div className="flex flex-wrap gap-2">
                      {interrogation.affected_groups.map((group, idx) => (
                        <Badge key={idx} variant="secondary">
                          {group}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
};

export default InterrogationDashboard;