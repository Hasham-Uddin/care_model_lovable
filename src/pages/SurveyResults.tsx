import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Brain, TrendingUp, Users, BarChart3, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SurveyResponse {
  id: string;
  user_id: string;
  project_id: string;
  session_number: number;
  survey_phase: string;
  responses: Record<string, string>;
  created_at: string;
}

interface ProjectOption {
  id: string;
  name: string;
}

const PHASE_LABELS: Record<string, string> = {
  pre: "Baseline (Session 1)",
  mid: "Midpoint (Session 6)",
  post: "Final (Session 12)",
};

const SCALE_QUESTIONS: Record<string, string> = {
  comfort_level: "Comfort with AI tools",
  bias_awareness: "Identifying AI biases",
  interrogation_confidence: "Challenging AI outputs",
  ethical_understanding: "Ethical considerations",
  community_centering: "Centering community voices",
  data_sovereignty: "Data sovereignty understanding",
};

const OPEN_QUESTIONS: Record<string, string> = {
  experience_reflection: "Experience with AI",
  growth_reflection: "Key learnings",
  journey_reflection: "AI relationship change",
  confidence_change: "Confidence shift moment",
};

const SurveyResults = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>(projectId || "all");
  const [surveys, setSurveys] = useState<SurveyResponse[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkRole();
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchSurveys();
  }, [selectedProject]);

  const checkRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    if (data?.some(r => r.role === "admin")) setIsAdmin(true);
  };

  const fetchProjects = async () => {
    const { data } = await supabase.from("projects").select("id, name").order("created_at", { ascending: false });
    if (data) setProjects(data);
  };

  const fetchSurveys = async () => {
    setLoading(true);
    let query = supabase.from("ai_literacy_surveys").select("*").order("created_at", { ascending: true });
    if (selectedProject !== "all") {
      query = query.eq("project_id", selectedProject);
    }
    const { data } = await query;
    if (data) {
      setSurveys(data as SurveyResponse[]);
      const userIds = [...new Set(data.map(s => s.user_id))];
      if (userIds.length > 0) {
        const { data: profileData } = await supabase.from("profiles").select("id, full_name, email").in("id", userIds);
        if (profileData) {
          const map: Record<string, string> = {};
          profileData.forEach(p => { map[p.id] = p.full_name || p.email; });
          setProfiles(map);
        }
      }
    }
    setLoading(false);
  };

  const getPhaseAverages = (phase: string) => {
    const phaseSurveys = surveys.filter(s => s.survey_phase === phase);
    if (phaseSurveys.length === 0) return null;

    const totals: Record<string, { sum: number; count: number }> = {};
    phaseSurveys.forEach(s => {
      const responses = s.responses as Record<string, string>;
      Object.entries(responses).forEach(([key, val]) => {
        if (SCALE_QUESTIONS[key]) {
          const num = parseInt(val);
          if (!isNaN(num)) {
            if (!totals[key]) totals[key] = { sum: 0, count: 0 };
            totals[key].sum += num;
            totals[key].count += 1;
          }
        }
      });
    });

    return Object.entries(totals).map(([key, { sum, count }]) => ({
      question: SCALE_QUESTIONS[key],
      average: Math.round((sum / count) * 10) / 10,
      count,
    }));
  };

  const getOpenResponses = (phase: string) => {
    const phaseSurveys = surveys.filter(s => s.survey_phase === phase);
    const responses: { user: string; question: string; answer: string; date: string }[] = [];
    phaseSurveys.forEach(s => {
      const r = s.responses as Record<string, string>;
      Object.entries(r).forEach(([key, val]) => {
        if (OPEN_QUESTIONS[key] && val?.trim()) {
          responses.push({
            user: profiles[s.user_id] || "Anonymous",
            question: OPEN_QUESTIONS[key],
            answer: val,
            date: new Date(s.created_at).toLocaleDateString(),
          });
        }
      });
    });
    return responses;
  };

  const getGrowthData = () => {
    const phases = ["pre", "mid", "post"];
    return Object.keys(SCALE_QUESTIONS).map(key => {
      const row: Record<string, any> = { question: SCALE_QUESTIONS[key] };
      phases.forEach(phase => {
        const phaseSurveys = surveys.filter(s => s.survey_phase === phase);
        const vals = phaseSurveys
          .map(s => parseInt((s.responses as Record<string, string>)[key]))
          .filter(v => !isNaN(v));
        row[phase] = vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : "—";
      });
      return row;
    });
  };

  const totalResponses = surveys.length;
  const uniqueParticipants = new Set(surveys.map(s => s.user_id)).size;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Brain className="h-6 w-6 text-primary" />
                AI Literacy Survey Results
              </h1>
              <p className="text-sm text-muted-foreground">Track team growth in AI confidence and understanding</p>
            </div>
          </div>
        </div>

        {(isAdmin || projects.length > 1) && (
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Filter by project" />
            </SelectTrigger>
            <SelectContent>
              {isAdmin && <SelectItem value="all">All Projects</SelectItem>}
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalResponses}</p>
                  <p className="text-xs text-muted-foreground">Total Responses</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary/50">
                  <Users className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{uniqueParticipants}</p>
                  <p className="text-xs text-muted-foreground">Unique Participants</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/50">
                  <TrendingUp className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {surveys.filter(s => s.survey_phase === "post").length > 0 ? "Active" : "In Progress"}
                  </p>
                  <p className="text-xs text-muted-foreground">Journey Status</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="growth">
          <TabsList>
            <TabsTrigger value="growth">Growth Tracker</TabsTrigger>
            <TabsTrigger value="pre">Baseline</TabsTrigger>
            <TabsTrigger value="mid">Midpoint</TabsTrigger>
            <TabsTrigger value="post">Final</TabsTrigger>
            <TabsTrigger value="reflections">Open Reflections</TabsTrigger>
          </TabsList>

          <TabsContent value="growth" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Growth Across Phases</CardTitle>
                <CardDescription>Average scores (1-5) across baseline, midpoint, and final surveys</CardDescription>
              </CardHeader>
              <CardContent>
                {surveys.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No survey data yet. Surveys are collected at Sessions 1, 6, and 12.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Competency</TableHead>
                        <TableHead className="text-center">Baseline</TableHead>
                        <TableHead className="text-center">Midpoint</TableHead>
                        <TableHead className="text-center">Final</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getGrowthData().map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium text-sm">{row.question}</TableCell>
                          {["pre", "mid", "post"].map(phase => (
                            <TableCell key={phase} className="text-center">
                              {row[phase] === "—" ? (
                                <span className="text-muted-foreground">—</span>
                              ) : (
                                <div className="flex flex-col items-center gap-1">
                                  <span className="font-semibold">{row[phase]}</span>
                                  <Progress value={(row[phase] as number / 5) * 100} className="h-1.5 w-16" />
                                </div>
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {["pre", "mid", "post"].map(phase => (
            <TabsContent key={phase} value={phase} className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{PHASE_LABELS[phase]}</CardTitle>
                  <CardDescription>
                    {surveys.filter(s => s.survey_phase === phase).length} responses collected
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const avgs = getPhaseAverages(phase);
                    if (!avgs) return <p className="text-sm text-muted-foreground text-center py-8">No responses yet for this phase.</p>;
                    return (
                      <div className="space-y-4">
                        {avgs.map((item, i) => (
                          <div key={i} className="space-y-1.5">
                            <div className="flex justify-between text-sm">
                              <span>{item.question}</span>
                              <span className="font-semibold">{item.average}/5</span>
                            </div>
                            <Progress value={(item.average / 5) * 100} className="h-2" />
                            <p className="text-xs text-muted-foreground">{item.count} responses</p>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>
          ))}

          <TabsContent value="reflections" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Open-Ended Reflections</CardTitle>
                <CardDescription>Qualitative responses from team members across all phases</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const allReflections = [...getOpenResponses("pre"), ...getOpenResponses("mid"), ...getOpenResponses("post")];
                  if (allReflections.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">No reflections submitted yet.</p>;
                  return (
                    <div className="space-y-4">
                      {allReflections.map((r, i) => (
                        <div key={i} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">{r.question}</Badge>
                            <span className="text-xs text-muted-foreground">{r.date}</span>
                          </div>
                          <p className="text-sm leading-relaxed">{r.answer}</p>
                          <p className="text-xs text-muted-foreground">— {r.user}</p>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SurveyResults;
