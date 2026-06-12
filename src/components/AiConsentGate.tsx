import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const CONSENT_VERSION = "1.0";

interface AiConsentGateProps {
  children: React.ReactNode;
  onConsentGiven?: () => void;
}

export const AiConsentGate = ({ children, onConsentGiven }: AiConsentGateProps) => {
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkConsent();
  }, []);

  const checkConsent = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setHasConsent(false); return; }

    const { data } = await supabase
      .from("ai_consent_log")
      .select("id")
      .eq("user_id", user.id)
      .eq("consent_version", CONSENT_VERSION)
      .eq("consent_given", true)
      .maybeSingle();

    if (data) {
      setHasConsent(true);
    } else {
      setHasConsent(false);
      setShowDialog(true);
    }
  };

  const handleAccept = async () => {
    if (!checked) return;
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); return; }

    const { error } = await supabase.from("ai_consent_log").upsert({
      user_id: user.id,
      consent_given: true,
      consent_version: CONSENT_VERSION,
      acknowledged_at: new Date().toISOString(),
    }, { onConflict: "user_id,consent_version" });

    if (error) {
      toast.error("Failed to save consent");
      console.error(error);
    } else {
      setHasConsent(true);
      setShowDialog(false);
      toast.success("AI policy acknowledged. You can now use AI features.");
      onConsentGiven?.();
    }
    setSubmitting(false);
  };

  if (hasConsent === null) return null;
  if (hasConsent) return <>{children}</>;

  return (
    <>
      {/* Render children but with AI disabled overlay */}
      <div className="relative">
        <div className="pointer-events-none opacity-50">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-lg">
          <Button variant="outline" onClick={() => setShowDialog(true)} className="pointer-events-auto">
            <Shield className="mr-2 h-4 w-4" />
            Review AI Policy to Enable
          </Button>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              AI Policy Acknowledgment Required
            </DialogTitle>
            <DialogDescription>
              Before using AI features, please review and acknowledge our AI policy.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm text-muted-foreground space-y-3">
              <p><strong>Our commitment:</strong> AI supports your thinking—you remain in control.</p>
              <ul className="space-y-1.5 ml-4">
                <li>• All AI-generated content is clearly labeled — you will always know when AI is being used</li>
                <li>• Your data is never used to train external AI models without explicit consent</li>
                <li>• AI features are completely optional and do not determine service eligibility</li>
                <li>• Outputs are advisory only — not automated decisions. Human review is always required</li>
                <li>• Anti-bias checks are built into every response using the AI Interrogation Tool (AIT) framework</li>
                <li>• Compliant with TRAIGA and aligned with NIST AI Risk Management Framework</li>
              </ul>
              <p className="italic text-xs">
                "AI at Measure is a tool in service of people and purpose. It must strengthen trust, not weaken it."
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <Button
                variant="link"
                className="p-0 h-auto text-sm justify-start"
                onClick={() => navigate("/ai-policy")}
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                Read the AI Acceptable Use Policy
              </Button>
              <Button
                variant="link"
                className="p-0 h-auto text-sm justify-start"
                onClick={() => navigate("/ai-tool-policy")}
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                Read the CARE Model AI Tool Policy & Data Stewardship Statement
              </Button>
            </div>

            <div className="flex items-start gap-3 pt-2">
              <Checkbox
                id="ai-consent"
                checked={checked}
                onCheckedChange={(v) => setChecked(v === true)}
              />
              <label htmlFor="ai-consent" className="text-sm leading-relaxed cursor-pointer">
                I have reviewed and acknowledge Measure's AI Acceptable Use Policy. I understand that AI outputs are advisory, subject to bias, and must be critically examined. I will not enter PII, PHI, or sensitive data into the AI system.
              </label>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Skip AI Features
              </Button>
              <Button onClick={handleAccept} disabled={!checked || submitting}>
                <Shield className="mr-2 h-4 w-4" />
                {submitting ? "Saving..." : "Acknowledge & Continue"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
