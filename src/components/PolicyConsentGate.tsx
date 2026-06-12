import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import measureLogo from "@/assets/measure-logo.png";

const POLICY_VERSION = "1.0";

export const PolicyConsentGate = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<"loading" | "needs_consent" | "consented">("loading");
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkConsent();
  }, []);

  const checkConsent = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setStatus("needs_consent"); return; }

    const { data } = await supabase
      .from("policy_consent")
      .select("id")
      .eq("user_id", user.id)
      .eq("policy_version", POLICY_VERSION)
      .maybeSingle();

    setStatus(data ? "consented" : "needs_consent");
  };

  const handleConsent = async () => {
    if (!checked) return;
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); return; }

    const { error } = await supabase.from("policy_consent").insert({
      user_id: user.id,
      policy_version: POLICY_VERSION,
    });

    if (error) {
      toast.error("Failed to save consent. Please try again.");
      console.error(error);
    } else {
      setStatus("consented");
      toast.success("Thank you for accepting our policies.");
    }
    setSubmitting(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (status === "consented") return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary-glow to-accent p-4">
      <Card className="w-full max-w-lg p-8 shadow-elevated">
        <div className="text-center mb-6">
          <img src={measureLogo} alt="MEASURE" className="h-12 w-auto mx-auto mb-4" />
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">Updated Policies — Consent Required</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            We've updated our Terms of Service and Privacy Policy. Please review and accept them to continue using the platform.
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <Link
            to="/terms-of-service"
            target="_blank"
            className="block w-full p-3 rounded-lg border border-border bg-muted/50 text-sm font-medium text-foreground hover:bg-muted transition-colors text-center"
          >
            📄 Read Terms of Service
          </Link>
          <Link
            to="/privacy-policy"
            target="_blank"
            className="block w-full p-3 rounded-lg border border-border bg-muted/50 text-sm font-medium text-foreground hover:bg-muted transition-colors text-center"
          >
            🔒 Read Privacy Policy
          </Link>
        </div>

        <div className="flex items-start gap-3 mb-6">
          <Checkbox
            id="policy-consent"
            checked={checked}
            onCheckedChange={(v) => setChecked(v === true)}
          />
          <label htmlFor="policy-consent" className="text-sm leading-relaxed cursor-pointer text-muted-foreground">
            I have read and agree to the{" "}
            <span className="font-medium text-foreground">Terms of Service</span> and{" "}
            <span className="font-medium text-foreground">Privacy Policy</span>.
          </label>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleSignOut} className="flex-1">
            Sign Out
          </Button>
          <Button onClick={handleConsent} disabled={!checked || submitting} className="flex-1">
            <Shield className="mr-2 h-4 w-4" />
            {submitting ? "Saving..." : "Accept & Continue"}
          </Button>
        </div>
      </Card>
    </div>
  );
};
