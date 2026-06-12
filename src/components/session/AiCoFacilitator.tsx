import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Loader2, AlertTriangle } from "lucide-react";

interface AiCoFacilitatorProps {
  sessionType: string;
  sessionNumber: number;
  context?: any;
  onResponseGenerated: (response: string) => void;
  onInterrogateClick: (output: string, prompt: string) => void;
  injectedPrompt?: string;
}

export const AiCoFacilitator = ({
  sessionType,
  sessionNumber,
  context,
  onResponseGenerated,
  onInterrogateClick,
  injectedPrompt,
}: AiCoFacilitatorProps) => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState("");

  // Auto-populate prompt when injectedPrompt changes
  useEffect(() => {
    if (injectedPrompt) {
      setPrompt(injectedPrompt);
    }
  }, [injectedPrompt]);
  const sessionPrompts: Record<number, string> = {
    1: "Rewrite this problem statement in 3 concise sentences with an anti-racist lens...",
    2: "List 3-5 groups most impacted by this problem (one per bullet)...",
    3: "Create a 5-item timeline of key events (one per bullet)...",
    4: "List 5-7 stakeholders with their power level (one per bullet)...",
    5: "List 3-5 key data points paired with community context...",
    6: "List 4-6 community assets by category (People, Places, Orgs, Culture)...",
    7: "List 3-4 equity concerns with this solution (one per bullet)...",
    8: "List inputs and activities needed (bulleted, one per line)...",
    9: "List expected outcomes in short/medium/long-term tiers...",
    10: "Suggest 3-5 community impact metrics (one per bullet)...",
    11: "List data collection points with method and timing...",
    12: "List 3-5 key insights and next steps for community showcase...",
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setLoading(true);
    try {
      // Ensure we have a fresh session JWT before invoking the protected edge function.
      const { data: sessionData } = await supabase.auth.getSession();
      let session = sessionData?.session;
      if (!session) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        session = refreshed?.session ?? null;
      }
      if (!session) {
        toast.error("Your session has expired", {
          description: "Please sign in again to continue.",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          sessionType,
          sessionNumber,
          userPrompt: prompt,
          context,
        },
      });

      if (error) throw error;

      if (data.rateLimited) {
        toast.error("Rate limit exceeded. Please wait a moment.", {
          description: "Too many requests in a short time period.",
        });
        return;
      }

      if (data.paymentRequired) {
        toast.error("AI credits depleted", {
          description: "Please add credits to your workspace.",
        });
        return;
      }

      const response = data.response;
      setAiResponse(response);
      onResponseGenerated(response);
      toast.success("AI response generated!");
    } catch (error: any) {
      console.error("AI generation error:", error);
      const msg = String(error?.message || "");
      const is401 = msg.includes("401") || msg.toLowerCase().includes("unauthorized") || msg.includes("non-2xx");
      toast.error(is401 ? "Session expired — please sign in again" : "Failed to generate response", {
        description: is401 ? "Your authentication token is no longer valid." : error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      <Badge variant="outline" className="mb-4 w-fit">
        <Sparkles className="mr-1 h-3 w-3" /> AI-Assisted · Gemini 2.5 Flash
      </Badge>

      <div className="flex-1 space-y-4 overflow-y-auto">
        <div>
          <label className="text-sm font-medium mb-2 block">
            Session Prompt Template
          </label>
          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg border border-border/50">
            {sessionPrompts[sessionNumber] || "No template for this session"}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Your Input</label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your text or question here..."
            rows={4}
            className="resize-none"
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Response
            </>
          )}
        </Button>

        {aiResponse && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">AI Response</label>
            </div>
            <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 text-sm">
              {aiResponse}
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={() => onInterrogateClick(aiResponse, prompt)}
              className="w-full"
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Interrogate with TIR
            </Button>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold">Anti-bias checks enabled:</span> All
          responses are self-audited for equity, representation, and historical
          context before display.
        </p>
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold">⚠️ Advisory only:</span> AI outputs are not decisions. They may contain bias, incomplete information, or misinterpretations. Your community's lived experience and critical examination remain the authority.
        </p>
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold">🔒 Privacy:</span> Your data is not used to train external AI models.{" "}
          <a href="/ai-policy" className="text-primary underline hover:no-underline">Read our full AI Policy</a>
        </p>
      </div>
    </div>
  );
};