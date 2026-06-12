import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import measureLogo from "@/assets/measure-logo.png";

const getParam = (url: URL, hash: URLSearchParams, key: string) =>
  url.searchParams.get(key) || hash.get(key);

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const completeAuthRedirect = async () => {
      const url = new URL(window.location.href);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const next = url.searchParams.get("next") || "/dashboard";
      const safeNext = next.startsWith("/") ? next : "/dashboard";
      const errorDescription = getParam(url, hash, "error_description");

      if (errorDescription) {
        setError(decodeURIComponent(errorDescription));
        return;
      }

      try {
        const code = url.searchParams.get("code");
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          navigate(safeNext, { replace: true });
          return;
        }

        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");
        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) throw sessionError;
          navigate(safeNext, { replace: true });
          return;
        }

        const tokenHash = getParam(url, hash, "token_hash");
        const token = getParam(url, hash, "token");
        const email = getParam(url, hash, "email");
        const type = getParam(url, hash, "type") || "recovery";

        if (tokenHash) {
          const { error: otpError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as any,
          });
          if (otpError) throw otpError;
          navigate(safeNext, { replace: true });
          return;
        }

        if (token && email) {
          const { error: otpError } = await supabase.auth.verifyOtp({
            email,
            token,
            type: type as any,
          });
          if (otpError) throw otpError;
          navigate(safeNext, { replace: true });
          return;
        }

        const { data } = await supabase.auth.getSession();
        if (data.session) {
          navigate(safeNext, { replace: true });
          return;
        }

        setError("This sign-in link is missing its secure token. Please request a new password reset email.");
      } catch (err: any) {
        setError(err?.message || "Could not validate this link. Please request a new password reset email.");
      }
    };

    void completeAuthRedirect();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary-glow to-accent p-4">
      <Card className="w-full max-w-md p-8 text-center shadow-elevated">
        <img src={measureLogo} alt="MEASURE" className="h-16 w-auto mx-auto mb-6" />
        <h1 className="text-2xl font-bold mb-2">Validating your link</h1>
        <p className="text-sm text-muted-foreground">
          {error || "Please wait while we securely finish this step."}
        </p>
        {error && (
          <Button className="mt-6" onClick={() => navigate("/auth", { replace: true })}>
            Back to sign in
          </Button>
        )}
      </Card>
    </div>
  );
};

export default AuthCallback;