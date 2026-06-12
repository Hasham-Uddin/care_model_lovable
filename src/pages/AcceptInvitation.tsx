import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, LogIn } from "lucide-react";

const AcceptInvitation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "checking_auth" | "accepting" | "success" | "error">("loading");
  const [error, setError] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [invitation, setInvitation] = useState<any>(null);

  useEffect(() => {
    if (!token) {
      setError("Invalid invitation link");
      setStatus("error");
      return;
    }
    checkInvitation();
  }, [token]);

  const checkInvitation = async () => {
    // Use a security-definer RPC to fetch the invitation by token (no anon table read)
    const { data: invRows, error: invErr } = await supabase
      .rpc("get_invitation_by_token", { p_token: token! });

    const inv = Array.isArray(invRows) ? invRows[0] : invRows;

    if (invErr || !inv) {
      setError("Invitation not found or has expired");
      setStatus("error");
      return;
    }

    if (inv.accepted_at) {
      setError("This invitation has already been accepted");
      setStatus("error");
      return;
    }

    if (new Date(inv.expires_at) < new Date()) {
      setError("This invitation has expired");
      setStatus("error");
      return;
    }

    setInvitation(inv);

    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setStatus("checking_auth");
      return;
    }

    // Accept the invitation
    acceptInvitation();
  };

  const acceptInvitation = async () => {
    setStatus("accepting");
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("accept-invitation", {
        body: { token },
      });

      if (fnErr) throw fnErr;
      if (data?.error) throw new Error(data.error);

      setProjectId(data.projectId);
      setStatus("success");
    } catch (err: any) {
      setError(err.message || "Failed to accept invitation");
      setStatus("error");
    }
  };

  const goToAuth = () => {
    // Store token in sessionStorage so we can redirect back after auth
    sessionStorage.setItem("pending_invitation_token", token!);
    navigate("/auth");
  };

  const roleLabel = invitation?.role === "care_team_leader" ? "CARE Team Leader" : "CARE Team Member";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-['Outfit']">Project Invitation</CardTitle>
          {invitation && (
            <CardDescription>
              You've been invited to join <strong>"{invitation.projects?.name}"</strong> as a <strong>{roleLabel}</strong>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === "loading" && (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          )}

          {status === "checking_auth" && (
            <>
              <p className="text-sm text-muted-foreground text-center">
                Please sign in or create an account to accept this invitation.
              </p>
              <Button onClick={goToAuth} className="w-full">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In / Create Account
              </Button>
            </>
          )}

          {status === "accepting" && (
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Accepting invitation...</p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="font-medium mb-1">Welcome to the team!</p>
              <p className="text-sm text-muted-foreground mb-4">
                You've joined as a {roleLabel}.
              </p>
              <Button onClick={() => navigate(`/project/${projectId}`)}>
                Go to Project
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="text-center">
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-3" />
              <p className="text-sm text-destructive mb-4">{error}</p>
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                Go to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvitation;
