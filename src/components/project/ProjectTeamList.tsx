import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock } from "lucide-react";

interface TeamMember {
  id: string;
  role: string;
  joined_at: string;
  user_id: string;
  profile?: { full_name: string | null; email: string };
}

interface PendingInvite {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  accepted_at: string | null;
}

interface ProjectTeamListProps {
  projectId: string;
}

export const ProjectTeamList = ({ projectId }: ProjectTeamListProps) => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<PendingInvite[]>([]);

  useEffect(() => {
    fetchTeam();
  }, [projectId]);

  const fetchTeam = async () => {
    const [membersRes, invitesRes] = await Promise.all([
      supabase
        .from("project_members")
        .select("id, role, joined_at, user_id")
        .eq("project_id", projectId),
      supabase
        .from("project_invitations")
        .select("id, email, full_name, role, created_at, accepted_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
    ]);

    if (membersRes.data) {
      // Fetch profiles for members
      const userIds = membersRes.data.map((m) => m.user_id);
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);

        const enriched = membersRes.data.map((m) => ({
          ...m,
          profile: profiles?.find((p) => p.id === m.user_id),
        }));
        setMembers(enriched);
      }
    }

    if (invitesRes.data) {
      setInvitations(invitesRes.data.filter((i) => !i.accepted_at));
    }
  };

  const getRoleLabel = (role: string) => {
    return role === "care_team_leader" ? "CARE Team Leader" : "CARE Team Member";
  };

  if (members.length === 0 && invitations.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          CARE Team ({members.length} members)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
            <div>
              <p className="font-medium text-sm">
                {member.profile?.full_name || "Unknown"}
              </p>
              <p className="text-xs text-muted-foreground">{member.profile?.email}</p>
            </div>
            <Badge variant={member.role === "care_team_leader" ? "default" : "secondary"} className="text-xs">
              {getRoleLabel(member.role)}
            </Badge>
          </div>
        ))}

        {invitations.length > 0 && (
          <>
            <p className="text-xs font-medium text-muted-foreground pt-2">Pending Invitations</p>
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between p-2 rounded-md border border-dashed">
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{inv.full_name}</p>
                    <p className="text-xs text-muted-foreground">{inv.email}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {getRoleLabel(inv.role)} (Pending)
                </Badge>
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
};
