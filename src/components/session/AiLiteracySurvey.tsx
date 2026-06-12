import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface AiLiteracySurveyProps {
  sessionNumber: number;
  projectId: string;
}

type SurveyPhase = "pre" | "mid" | "post";

const SURVEY_SESSIONS: Record<number, SurveyPhase> = {
  1: "pre",
  6: "mid",
  12: "post",
};

const PHASE_LABELS: Record<SurveyPhase, string> = {
  pre: "Baseline Assessment",
  mid: "Midpoint Check-In",
  post: "Final Reflection",
};

const PHASE_DESCRIPTIONS: Record<SurveyPhase, string> = {
  pre: "Before we begin, let's understand your current comfort level with AI. This helps us tailor the experience and measure your growth.",
  mid: "You're halfway through! Let's check in on how your understanding and confidence with AI has evolved.",
  post: "Congratulations on completing the journey! Let's reflect on how your AI literacy has grown.",
};

interface SurveyQuestion {
  id: string;
  text: string;
  type: "scale" | "open";
  phases: SurveyPhase[];
}

const SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    id: "comfort_level",
    text: "How comfortable are you with using AI tools in your work?",
    type: "scale",
    phases: ["pre", "mid", "post"],
  },
  {
    id: "bias_awareness",
    text: "How confident are you in identifying potential biases in AI-generated content?",
    type: "scale",
    phases: ["pre", "mid", "post"],
  },
  {
    id: "interrogation_confidence",
    text: "How confident do you feel in questioning or challenging AI outputs?",
    type: "scale",
    phases: ["pre", "mid", "post"],
  },
  {
    id: "ethical_understanding",
    text: "How well do you understand the ethical considerations of using AI in community work?",
    type: "scale",
    phases: ["pre", "mid", "post"],
  },
  {
    id: "community_centering",
    text: "How confident are you in ensuring AI outputs center community voices rather than replacing them?",
    type: "scale",
    phases: ["pre", "mid", "post"],
  },
  {
    id: "data_sovereignty",
    text: "How well do you understand data sovereignty and consent when using AI tools?",
    type: "scale",
    phases: ["mid", "post"],
  },
  {
    id: "experience_reflection",
    text: "What has been your experience with AI so far? Share any thoughts, concerns, or excitement.",
    type: "open",
    phases: ["pre"],
  },
  {
    id: "growth_reflection",
    text: "What is the most important thing you've learned about AI and community work so far?",
    type: "open",
    phases: ["mid"],
  },
  {
    id: "journey_reflection",
    text: "How has your relationship with AI changed throughout this process? What would you tell someone just starting?",
    type: "open",
    phases: ["post"],
  },
  {
    id: "confidence_change",
    text: "Describe a moment during this process when your confidence in interrogating AI shifted.",
    type: "open",
    phases: ["mid", "post"],
  },
];

const SCALE_OPTIONS = [
  { value: "1", label: "Not at all" },
  { value: "2", label: "Slightly" },
  { value: "3", label: "Somewhat" },
  { value: "4", label: "Quite" },
  { value: "5", label: "Very" },
];

export const AiLiteracySurvey = ({ sessionNumber, projectId }: AiLiteracySurveyProps) => {
  const [open, setOpen] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});

  const phase = SURVEY_SESSIONS[sessionNumber] as SurveyPhase | undefined;
  const questions = phase ? SURVEY_QUESTIONS.filter((q) => q.phases.includes(phase)) : [];

  useEffect(() => {
    if (!phase) { setLoading(false); return; }
    checkExistingSurvey();
  }, [projectId, phase]);

  const checkExistingSurvey = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("ai_literacy_surveys")
      .select("id")
      .eq("user_id", user.id)
      .eq("project_id", projectId)
      .eq("survey_phase", phase)
      .maybeSingle();

    if (data) {
      setAlreadyCompleted(true);
    } else {
      setOpen(true);
    }
    setLoading(false);
  };

  const handleResponse = (questionId: string, value: string) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
  };

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;
  const canProceed = currentQuestion && responses[currentQuestion.id]?.trim();
  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleSubmit = async () => {
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); return; }

    const { error } = await supabase.from("ai_literacy_surveys").insert({
      user_id: user.id,
      project_id: projectId,
      session_number: sessionNumber,
      survey_phase: phase,
      responses,
    });

    if (error) {
      toast.error("Failed to save survey. Please try again.");
    } else {
      toast.success("Survey submitted! Thank you for your reflection.");
      setAlreadyCompleted(true);
      setOpen(false);
    }
    setSubmitting(false);
  };

  if (!phase || loading || alreadyCompleted) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="h-5 w-5 text-primary" />
            <Badge variant="secondary" className="text-xs">
              {PHASE_LABELS[phase]}
            </Badge>
          </div>
          <DialogTitle className="text-xl">AI Literacy & Comfort Survey</DialogTitle>
          <DialogDescription>{PHASE_DESCRIPTIONS[phase]}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="flex items-center gap-3">
            <Progress value={progress} className="flex-1 h-2" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {currentStep + 1} / {questions.length}
            </span>
          </div>

          {currentQuestion && (
            <div className="space-y-4 min-h-[180px]">
              <p className="font-medium text-sm leading-relaxed">
                {currentQuestion.text}
              </p>

              {currentQuestion.type === "scale" ? (
                <RadioGroup
                  value={responses[currentQuestion.id] || ""}
                  onValueChange={(v) => handleResponse(currentQuestion.id, v)}
                  className="space-y-2"
                >
                  {SCALE_OPTIONS.map((opt) => (
                    <div key={opt.value} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value={opt.value} id={`${currentQuestion.id}-${opt.value}`} />
                      <Label htmlFor={`${currentQuestion.id}-${opt.value}`} className="cursor-pointer flex-1 text-sm">
                        <span className="font-medium mr-2">{opt.value}.</span>
                        {opt.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <Textarea
                  value={responses[currentQuestion.id] || ""}
                  onChange={(e) => handleResponse(currentQuestion.id, e.target.value)}
                  placeholder="Share your thoughts..."
                  className="min-h-[100px] resize-none"
                  spellCheck
                />
              )}
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep((s) => s - 1)}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>

            {isLastStep ? (
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!canProceed || submitting}
              >
                {submitting ? "Submitting..." : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Submit Survey
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => setCurrentStep((s) => s + 1)}
                disabled={!canProceed}
              >
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
