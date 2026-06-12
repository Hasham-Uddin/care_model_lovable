import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AuthGuard } from "@/components/AuthGuard";
import { RoleGuard } from "@/components/RoleGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Shield, Users, Loader2, UserCheck } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Database } from "@/integrations/supabase/types";
import { AiPolicyReport } from "@/components/admin/AiPolicyReport";

type UserRole = Database["public"]["Enums"]["user_role"];
type ProjectRole = Database["public"]["Enums"]["project_role"];

const ALL_ROLES: UserRole[] = ["admin", "facilitator", "monitor"];

interface UserWithRoles {
  id: string;
  email: string;
  full_name: string | null;
  roles: UserRole[];
}

interface ProjectMemberRow {
  id: string;
  user_id: string;
  role: ProjectRole;
  joined_at: string;
  project_name: string;
  user_name: string;
  user_email: string;
}

const AdminPanel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMemberRow[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchProjectMembers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Combine data
      const usersWithRoles: UserWithRoles[] = (profiles || []).map((profile) => ({
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        roles: (roles || [])
          .filter((r) => r.user_id === profile.id)
          .map((r) => r.role as UserRole),
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectMembers = async () => {
    try {
      const { data: members } = await supabase
        .from("project_members")
        .select("id, user_id, role, joined_at, project_id")
        .order("joined_at", { ascending: false });

      if (!members || members.length === 0) { setProjectMembers([]); return; }

      const projectIds = [...new Set(members.map(m => m.project_id))];
      const userIds = [...new Set(members.map(m => m.user_id))];

      const [{ data: projects }, { data: profiles }] = await Promise.all([
        supabase.from("projects").select("id, name").in("id", projectIds),
        supabase.from("profiles").select("id, full_name, email").in("id", userIds),
      ]);

      const projectMap = Object.fromEntries((projects || []).map(p => [p.id, p.name]));
      const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));

      setProjectMembers(members.map(m => ({
        id: m.id,
        user_id: m.user_id,
        role: m.role as ProjectRole,
        joined_at: m.joined_at,
        project_name: projectMap[m.project_id] || "Unknown Project",
        user_name: profileMap[m.user_id]?.full_name || "No name",
        user_email: profileMap[m.user_id]?.email || "",
      })));
    } catch (error) {
      console.error("Error fetching project members:", error);
    }
  };

  const toggleRole = async (userId: string, role: UserRole, hasRole: boolean) => {
    setSaving(userId);
    try {
      if (hasRole) {
        // Remove role
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", role);

        if (error) throw error;

        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, roles: u.roles.filter((r) => r !== role) } : u
          )
        );

        toast({
          title: "Role removed",
          description: `Removed ${role} role successfully`,
        });
      } else {
        // Add role
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role });

        if (error) throw error;

        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, roles: [...u.roles, role] } : u
          )
        );

        toast({
          title: "Role added",
          description: `Added ${role} role successfully`,
        });
      }
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const getRoleBadgeVariant = (role: UserRole): "default" | "secondary" | "destructive" | "outline" => {
    switch (role) {
      case "admin":
        return "destructive";
      case "facilitator":
        return "default";
      case "researcher":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={["admin"]}>
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
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <Shield className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold font-['Outfit']">Admin Panel</h1>
                  <p className="text-muted-foreground">Manage user roles and permissions</p>
                </div>
              </div>
            </div>
          </header>

          <main className="container mx-auto px-4 py-8">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid sm:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <Users className="h-8 w-8 text-primary" />
                        <div>
                          <p className="text-2xl font-bold">{users.length}</p>
                          <p className="text-sm text-muted-foreground">Total Users</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <Shield className="h-8 w-8 text-destructive" />
                        <div>
                          <p className="text-2xl font-bold">
                            {users.filter((u) => u.roles.includes("admin")).length}
                          </p>
                          <p className="text-sm text-muted-foreground">Admins</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <Users className="h-8 w-8 text-[#253B96]" />
                        <div>
                          <p className="text-2xl font-bold">
                            {users.filter((u) => u.roles.includes("facilitator")).length}
                          </p>
                          <p className="text-sm text-muted-foreground">Facilitators</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* User List */}
                <Card>
                  <CardHeader>
                    <CardTitle>User Roles</CardTitle>
                    <CardDescription>
                      Click on roles to add or remove them from users
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {users.map((user) => (
                        <div
                          key={user.id}
                          className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <p className="font-medium">
                                {user.full_name || "No name"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {user.email}
                              </p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {user.roles.map((role) => (
                                  <Badge
                                    key={role}
                                    variant={getRoleBadgeVariant(role)}
                                    className="text-xs"
                                  >
                                    {role}
                                  </Badge>
                                ))}
                                {user.roles.length === 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    No roles assigned
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {ALL_ROLES.map((role) => {
                                const hasRole = user.roles.includes(role);
                                return (
                                  <label
                                    key={role}
                                    className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors"
                                  >
                                    <Checkbox
                                      checked={hasRole}
                                      disabled={saving === user.id}
                                      onCheckedChange={() =>
                                        toggleRole(user.id, role, hasRole)
                                      }
                                    />
                                    <span className="capitalize">{role.replace("_", " ")}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* CARE Team Members */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-primary" />
                      CARE Team Members
                    </CardTitle>
                    <CardDescription>
                      Project-scoped Leaders and Members across all projects
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {projectMembers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">No CARE Team members have been invited yet.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Project</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {projectMembers.map((m) => (
                            <TableRow key={m.id}>
                              <TableCell className="font-medium">{m.user_name}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{m.user_email}</TableCell>
                              <TableCell>{m.project_name}</TableCell>
                              <TableCell>
                                <Badge variant={m.role === "care_team_leader" ? "default" : "secondary"} className="text-xs">
                                  {m.role === "care_team_leader" ? "CARE Team Leader" : "CARE Team Member"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(m.joined_at).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                {/* AI Use Policy Report */}
                <AiPolicyReport />
              </div>
            )}
          </main>
        </div>
      </RoleGuard>
    </AuthGuard>
  );
};

export default AdminPanel;
