import { Check, FileText, Sparkles, AlertTriangle, RefreshCw, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkflowStepperProps {
  currentStep: number;
  hasWorksheetData: boolean;
  hasAiResponse: boolean;
  hasRefinedOutput: boolean;
}

const STEPS = [
  {
    number: 1,
    label: "Watch & Learn",
    description: "Watch the tutorial video",
    icon: FileText,
  },
  {
    number: 2,
    label: "Fill Worksheet",
    description: "Answer the guide questions",
    icon: FileText,
  },
  {
    number: 3,
    label: "Ask AI",
    description: "Get AI-generated insights",
    icon: Sparkles,
  },
  {
    number: 4,
    label: "Interrogate",
    description: "Check AI for bias & harms",
    icon: AlertTriangle,
  },
  {
    number: 5,
    label: "Refine & Save",
    description: "Review refined output & save",
    icon: Save,
  },
];

export const WorkflowStepper = ({
  currentStep,
  hasWorksheetData,
  hasAiResponse,
  hasRefinedOutput,
}: WorkflowStepperProps) => {
  const getStepStatus = (stepNumber: number) => {
    // Step 1 (Watch Tutorial) — we can't tell whether the user actually
    // watched, so it's "current" when nothing else has happened yet, and
    // "complete" only once the user has moved past it (step >= 2).
    if (stepNumber === 1) {
      if (currentStep === 1) return "current";
      return "complete";
    }
    if (stepNumber === 2) return hasWorksheetData ? "complete" : currentStep === 2 ? "current" : "upcoming";
    if (stepNumber === 3) return hasAiResponse ? "complete" : currentStep === 3 ? "current" : "upcoming";
    if (stepNumber === 4) return hasRefinedOutput ? "complete" : currentStep === 4 ? "current" : "upcoming";
    if (stepNumber === 5) return hasRefinedOutput ? "current" : "upcoming";
    return "upcoming";
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Your Workflow
        </h3>
        <span className="text-xs text-muted-foreground">
          Follow these steps in order
        </span>
      </div>
      <div className="flex items-center gap-0">
        {STEPS.map((step, index) => {
          const status = getStepStatus(step.number);
          const StepIcon = step.icon;
          return (
            <div key={step.number} className="flex items-center flex-1 last:flex-initial">
              <div className="flex flex-col items-center gap-1.5 min-w-0">
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 flex-shrink-0",
                    status === "complete" && "bg-primary border-primary text-primary-foreground",
                    status === "current" && "border-primary bg-primary/10 text-primary animate-pulse",
                    status === "upcoming" && "border-muted-foreground/30 text-muted-foreground/40"
                  )}
                >
                  {status === "complete" ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <StepIcon className="w-4 h-4" />
                  )}
                </div>
                <div className="text-center min-w-0">
                  <p
                    className={cn(
                      "text-xs font-medium leading-tight",
                      status === "complete" && "text-primary",
                      status === "current" && "text-primary font-semibold",
                      status === "upcoming" && "text-muted-foreground/50"
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 leading-tight hidden sm:block">
                    {step.description}
                  </p>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-2 mt-[-1.25rem] rounded-full transition-colors duration-300",
                    status === "complete" ? "bg-primary" : "bg-muted-foreground/15"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
