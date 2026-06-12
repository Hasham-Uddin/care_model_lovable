import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import measureLogo from "@/assets/measure-logo.png";
import { z } from "zod";

const signUpSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
  fullName: z.string().trim().min(1, "Full name is required").max(100),
});

const signInSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255),
  password: z.string().min(1, "Password is required").max(128),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const navigate = useNavigate();

  const handleForgotPassword = async () => {
    const parsed = z.string().trim().email("Enter a valid email").max(255).safeParse(email);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message || "Enter a valid email");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset link sent. Check your email.");
      setShowForgot(false);
    } catch (err: any) {
      toast.error(err.message || "Could not send reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      toast.error("You must agree to the Terms of Service and Privacy Policy");
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        const validated = signInSchema.parse({ email, password });
        const { error } = await supabase.auth.signInWithPassword({
          email: validated.email,
          password: validated.password,
        });
        if (error) throw error;
        // Record policy consent on login
        const { data: { user: loginUser } } = await supabase.auth.getUser();
        if (loginUser) {
          await supabase.from("policy_consent").upsert({
            user_id: loginUser.id,
            policy_version: "1.0",
          }, { onConflict: "user_id,policy_version" });
        }
        toast.success("Welcome back!");
        // Check for pending invitation redirect
        const pendingToken = sessionStorage.getItem("pending_invitation_token");
        if (pendingToken) {
          sessionStorage.removeItem("pending_invitation_token");
          navigate(`/accept-invitation?token=${pendingToken}`);
        } else {
          navigate("/dashboard");
        }
      } else {
        const validated = signUpSchema.parse({ email, password, fullName });
        const { error } = await supabase.auth.signUp({
          email: validated.email,
          password: validated.password,
          options: {
            data: {
              full_name: validated.fullName,
            },
          },
        });
        if (error) throw error;
        // Record policy consent for new signups
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("policy_consent").insert({
            user_id: user.id,
            policy_version: "1.0",
          });
        }
        toast.success("Account created! You can now sign in.");
        navigate("/dashboard");
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0]?.message || "Validation failed");
      } else {
        toast.error(error.message || "Authentication failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary-glow to-accent p-4">
      <Card className="w-full max-w-md p-8 shadow-elevated">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mx-auto mb-6">
            <img 
              src={measureLogo} 
              alt="MEASURE" 
              className="h-16 w-auto"
            />
          </div>
          <h1 className="text-3xl font-bold mb-2">CARE Model</h1>
          <p className="text-muted-foreground">
            Community Mobilization & Interrogative AI
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required={!isLogin}
                placeholder="Enter your full name"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              {isLogin && (
                <button
                  type="button"
                  onClick={() => setShowForgot((v) => !v)}
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              minLength={6}
            />
          </div>

          {showForgot && isLogin && (
            <div className="rounded-md border border-border bg-muted/30 p-3 space-y-2">
              <p className="text-sm text-muted-foreground">
                Enter your email above, then click Send reset link. You'll get an email with a link to set a new password.
              </p>
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={handleForgotPassword} disabled={loading}>
                  Send reset link
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setShowForgot(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <Checkbox
              id="terms-consent"
              checked={agreedToTerms}
              onCheckedChange={(v) => setAgreedToTerms(v === true)}
            />
            <label htmlFor="terms-consent" className="text-sm leading-relaxed cursor-pointer text-muted-foreground">
              I agree to the{" "}
              <Link to="/terms-of-service" target="_blank" className="text-primary underline hover:text-primary/80">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy-policy" target="_blank" className="text-primary underline hover:text-primary/80">
                Privacy Policy
              </Link>
            </label>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !agreedToTerms}
          >
            {loading ? "Processing..." : isLogin ? "Sign In" : "Sign Up"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-primary hover:underline"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <p className="font-semibold mb-2">About CARE with TIR</p>
          <p>
            This system integrates Theory of Interrogative Reasoning to challenge
            AI outputs, capture biases, and build anti-bias datasets.
          </p>
        </div>

        <div className="mt-4 flex justify-center gap-4 text-xs text-muted-foreground">
          <Link to="/terms-of-service" className="hover:text-primary underline underline-offset-2">
            Terms of Service
          </Link>
          <span>·</span>
          <Link to="/privacy-policy" className="hover:text-primary underline underline-offset-2">
            Privacy Policy
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Auth;