import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import measureLogo from "@/assets/measure-logo.png";

const getParam = (url: URL, hash: URLSearchParams, key: string) =>
  url.searchParams.get(key) || hash.get(key);

const ResetPassword = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const exchangedRef = useRef(false);

  useEffect(() => {
    const init = async () => {
      try {
        const url = new URL(window.location.href);
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const errDesc = getParam(url, hash, "error_description");
        if (errDesc) {
          setError(decodeURIComponent(errDesc));
          return;
        }

        // 1) Existing session (already signed in via recovery)
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          setReady(true);
          return;
        }

        // 2) PKCE flow: ?code=... in query string
        const code = url.searchParams.get("code");
        if (code && !exchangedRef.current) {
          exchangedRef.current = true;
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exErr) {
            setError(
              "This reset link is invalid or has already been used. Request a new one from the sign-in page.",
            );
            return;
          }
          // clean the code from URL
          window.history.replaceState({}, "", window.location.pathname);
          setReady(true);
          return;
        }

        // 3) Implicit flow: #access_token=...&type=recovery in hash
        const access_token = getParam(url, hash, "access_token");
        const refresh_token = getParam(url, hash, "refresh_token");
        if (access_token && refresh_token) {
          const { error: setErr } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (setErr) {
            setError("Could not validate your reset link. Please request a new one.");
            return;
          }
          window.history.replaceState({}, "", window.location.pathname);
          setReady(true);
          return;
        }

        // 4) Email template OTP flow: token_hash or token/email in either query or hash
        const tokenHash = getParam(url, hash, "token_hash");
        const token = getParam(url, hash, "token");
        const email = getParam(url, hash, "email");
        const type = getParam(url, hash, "type") || "recovery";

        if (tokenHash) {
          const { error: otpErr } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as any,
          });
          if (otpErr) {
            setError("This reset link is invalid or has already been used. Request a new one from the sign-in page.");
            return;
          }
          window.history.replaceState({}, "", window.location.pathname);
          setReady(true);
          return;
        }

        if (token && email) {
          const { error: otpErr } = await supabase.auth.verifyOtp({
            email,
            token,
            type: type as any,
          });
          if (otpErr) {
            setError("This reset link is invalid or has already been used. Request a new one from the sign-in page.");
            return;
          }
          window.history.replaceState({}, "", window.location.pathname);
          setReady(true);
          return;
        }

        setError(
          "This reset link opened without its secure token. Please request a new password reset email from the sign-in page.",
        );
      } catch (e: any) {
        setError(e?.message || "Could not validate your reset link.");
      }
    };

    // Listen for events too (PASSWORD_RECOVERY / SIGNED_IN)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
        setError(null);
      }
    });

    void init();
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated. Please sign in.");
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (err: any) {
      toast.error(err.message || "Could not update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary-glow to-accent p-4">
      <Card className="w-full max-w-md p-8 shadow-elevated">
        <div className="text-center mb-8">
          <img src={measureLogo} alt="MEASURE" className="h-16 w-auto mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-2">Reset your password</h1>
          <p className="text-muted-foreground text-sm">
            {error
              ? error
              : ready
              ? "Enter a new password for your account."
              : "Validating your reset link..."}
          </p>
        </div>

        {!error && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={!ready}
                placeholder="At least 6 characters"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm new password</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
                disabled={!ready}
              />
            </div>
            <Button type="submit" className="w-full" disabled={!ready || loading}>
              {loading ? "Updating..." : "Update password"}
            </Button>
          </form>
        )}

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => navigate("/auth")}
            className="text-sm text-primary hover:underline"
          >
            Back to sign in
          </button>
        </div>
      </Card>
    </div>
  );
};

export default ResetPassword;
