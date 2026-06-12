import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Eye,
  Users,
  BarChart3,
  CheckCircle2,
  PlayCircle,
  Circle,
  ArrowRight,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { toast } from "sonner";

interface FacilitatorProject {
  id: string;
  name: string;
  facilitator_id: string;
  created_at: string;
  facilitator_email: string;
  facilitator_name: string;
  organization_name: string;
  organization_location: string;
  total_sessions: number;
  completed_sessions: number;
  in_progress_sessions: number;
}

const MonitorDashboard = () => {
  const [projects, setProjects] = useState<FacilitatorProject[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllProjects();
  }, []);

  const fetchAllProjects = async () => {
    try {
      // Fetch all projects (monitor RLS policy allows SELECT on all)
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select(`
          id,
          name,
          facilitator_id,
          created_at,
          organizations (name, location)
        `)
        .order("created_at", { ascending: false });

      if (projectsError) throw projectsError;

      if (!projectsData || projectsData.length === 0) {
        setProjects([]);
        setLoading(false);
        return;
      }

      // Fetch all sessions for progress tracking
      const projectIds = projectsData.map((p) => p.id);
      const { data: sessionsData } = await supabase
        .from("sessions")
        .select("project_id, status")
        .in("project_id", projectIds);

      // Fetch facilitator profiles
      const facilitatorIds = [...new Set(projectsData.map((p) => p.facilitator_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", facilitatorIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.id, p])
      );

      // Build session stats per project
      const sessionStats = new Map<string, { total: number; completed: number; in_progress: number }>();
      (sessionsData || []).forEach((s) => {
        const stats = sessionStats.get(s.project_id) || { total: 0, completed: 0, in_progress: 0 };
        stats.total++;
        if (s.status === "completed") stats.completed++;
        if (s.status === "in_progress") stats.in_progress++;
        sessionStats.set(s.project_id, stats);
      });

      const enriched: FacilitatorProject[] = projectsData.map((p) => {
        const profile = profileMap.get(p.facilitator_id);
        const stats = sessionStats.get(p.id) || { total: 12, completed: 0, in_progress: 0 };
        return {
          id: p.id,
          name: p.name,
          facilitator_id: p.facilitator_id,
          created_at: p.created_at,
          facilitator_email: profile?.email || "Unknown",
          facilitator_name: profile?.full_name || profile?.email || "Unknown",
          organization_name: (p.organizations as any)?.name || "Unknown",
          organization_location: (p.organizations as any)?.location || "",
          total_sessions: stats.total || 12,
          completed_sessions: stats.completed,
          in_progress_sessions: stats.in_progress,
        };
      });

      setProjects(enriched);
    } catch (error: any) {
      toast.error("Failed to load facilitator data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercent = (completed: number, total: number) =>
    total > 0 ? Math.round((completed / total) * 100) : 0;

  const getStatusBadge = (completed: number, total: number, inProgress: number) => {
    if (completed === total && total > 0)
      return <Badge className="bg-accent/10 text-accent border-accent/20">Complete</Badge>;
    if (inProgress > 0 || completed > 0)
      return <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">In Progress</Badge>;
    return <Badge variant="outline">Not Started</Badge>;
  };

  // Summary stats
  const totalFacilitators = new Set(projects.map((p) => p.facilitator_id)).size;
  const totalCompleted = projects.filter(
    (p) => p.completed_sessions === p.total_sessions && p.total_sessions > 0
  ).length;
  const avgProgress =
    projects.length > 0
      ? Math.round(
          projects.reduce(
            (sum, p) => sum + getProgressPercent(p.completed_sessions, p.total_sessions),
            0
          ) / projects.length
        )
      : 0;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading monitor dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Eye className="h-6 w-6 text-primary" />
                Monitor Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Track facilitator progress on Community Mobilization Guides (read-only)
              </p>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 space-y-8">
          {/* Summary Cards */}
          <div className="grid sm:grid-cols-3 gap-4">
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Facilitators</p>
                  <p className="text-2xl font-bold">{totalFacilitators}</p>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <CheckCircle2 className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Guides Completed</p>
                  <p className="text-2xl font-bold">{totalCompleted}</p>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary/10">
                  <BarChart3 className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Progress</p>
                  <p className="text-2xl font-bold">{avgProgress}%</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Facilitator Projects Table */}
          <Card className="overflow-hidden">
            <div className="p-5 border-b border-border/50">
              <h2 className="text-lg font-semibold">All Facilitator Projects</h2>
            </div>
            {projects.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                No projects found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Facilitator</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => {
                    const pct = getProgressPercent(
                      project.completed_sessions,
                      project.total_sessions
                    );
                    return (
                      <TableRow key={project.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{project.facilitator_name}</p>
                            <p className="text-xs text-muted-foreground">{project.facilitator_email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{project.name}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{project.organization_name}</p>
                            {project.organization_location && (
                              <p className="text-xs text-muted-foreground">{project.organization_location}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {(project as any).start_date
                              ? new Date((project as any).start_date).toLocaleDateString("en-US", {
                                  month: "short", day: "numeric", year: "numeric",
                                })
                              : new Date(project.created_at).toLocaleDateString("en-US", {
                                  month: "short", day: "numeric", year: "numeric",
                                })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3 min-w-[140px]">
                            <Progress value={pct} className="h-2 flex-1" />
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {project.completed_sessions}/{project.total_sessions}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(
                            project.completed_sessions,
                            project.total_sessions,
                            project.in_progress_sessions
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/monitor/project/${project.id}`)}
                          >
                            <Eye className="mr-1 h-4 w-4" />
                            View
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Card>
        </main>
      </div>
    </DashboardLayout>
  );
};

export default MonitorDashboard;
