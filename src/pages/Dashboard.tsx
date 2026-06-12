import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, FileText, Trash2, Filter } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/DashboardLayout";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Project {
  id: string;
  name: string;
  organization_id: string;
  facilitator_id: string;
  data_donation_consent: boolean;
  created_at: string;
  organizations: {
    name: string;
    location: string;
  };
}

const Dashboard = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"mine" | "all">("mine");
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAndFetch();
  }, []);

  const checkAdminAndFetch = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const admin = roles?.some((r) => r.role === "admin") ?? false;
      setIsAdmin(admin);

      await fetchProjects();
    } catch (error) {
      console.error(error);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          organizations (
            name,
            location
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      toast.error("Failed to load projects");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = isAdmin && filter === "mine"
    ? projects.filter((p) => p.facilitator_id === userId)
    : projects;

  const handleDeleteProject = async (e: React.MouseEvent, projectId: string, projectName: string) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;

      toast.success(`"${projectName}" deleted successfully`);
      setProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (error: any) {
      toast.error("Failed to delete project");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your CARE projects...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
        {/* Page Header */}
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Projects</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Manage your CARE Model facilitation projects
                </p>
              </div>
              <Button
                onClick={() => navigate("/create-project")}
                size="lg"
                className="shadow-elevated hover:shadow-glow"
              >
                <Plus className="mr-2 h-5 w-5" />
                New Project
              </Button>
            </div>
            {isAdmin && (
              <Tabs value={filter} onValueChange={(v) => setFilter(v as "mine" | "all")} className="mt-3">
                <TabsList>
                  <TabsTrigger value="mine">My Projects</TabsTrigger>
                  <TabsTrigger value="all">All Projects</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>
        </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6">
              <FileText className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No Projects Yet</h2>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Start your first CARE Model project to facilitate community mobilization
              with your partner organization.
            </p>
            <Button
              onClick={() => navigate("/create-project")}
              size="lg"
              className="shadow-elevated"
            >
              <Plus className="mr-2 h-5 w-5" />
              Create Your First Project
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                className="p-6 hover:shadow-elevated transition-all cursor-pointer group"
                onClick={() => navigate(`/project/${project.id}`)}
              >
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {project.organizations?.name}
                    </p>
                    {project.organizations?.location && (
                      <p className="text-xs text-muted-foreground">
                        {project.organizations.location}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    {project.data_donation_consent ? (
                      <span className="flex items-center gap-1 text-accent">
                        <div className="w-2 h-2 rounded-full bg-accent"></div>
                        Data contribution: Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                        Data contribution: Inactive
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    >
                      Open Project
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="shrink-0 text-muted-foreground hover:text-destructive hover:border-destructive"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Project</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{project.name}"? This action cannot be undone
                            and will remove all associated sessions and data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={(e) => handleDeleteProject(e, project.id, project.name)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;