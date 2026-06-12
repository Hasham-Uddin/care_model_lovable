import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";

const COOKIE_CONSENT_KEY = "measure_cookie_consent";

type ConsentLevel = "all" | "essential" | null;

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleConsent = (level: ConsentLevel) => {
    if (level) {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ level, timestamp: new Date().toISOString() }));
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-3xl mx-auto bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Cookie className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-foreground mb-1">We value your privacy</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We use essential cookies to make this platform work. With your consent, we may also use analytics cookies 
                to improve your experience. Your data is never sold or used to train external AI models. 
                See our <a href="/privacy-policy" className="text-primary underline hover:text-primary/80">Privacy Policy</a> and <a href="/terms-of-service" className="text-primary underline hover:text-primary/80">Terms of Service</a>.
              </p>

              {showDetails && (
                <div className="mt-4 space-y-3 text-sm">
                  <div className="bg-muted rounded-lg p-4 border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-foreground">Essential Cookies</span>
                      <span className="text-xs text-muted-foreground bg-primary/10 px-2 py-0.5 rounded-full">Always active</span>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Required for authentication, session management, and core platform functionality.
                    </p>
                  </div>
                  <div className="bg-muted rounded-lg p-4 border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-foreground">Analytics Cookies</span>
                      <span className="text-xs text-muted-foreground bg-secondary/10 px-2 py-0.5 rounded-full">Optional</span>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Help us understand how facilitators use the platform so we can improve the experience. 
                      Fully anonymized and never shared with third parties.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 mt-4">
                <Button
                  size="sm"
                  onClick={() => handleConsent("all")}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Accept All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleConsent("essential")}
                  className="border-border"
                >
                  Essential Only
                </Button>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                >
                  {showDetails ? "Hide details" : "Cookie details"}
                </button>
              </div>
            </div>
            <button
              onClick={() => handleConsent("essential")}
              className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              aria-label="Close cookie banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
