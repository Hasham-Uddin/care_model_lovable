import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StepCardProps {
  stepNumber: number;
  title: string;
  hint?: string;
  icon: LucideIcon;
  isActive?: boolean;
  isComplete?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const StepCard = ({
  stepNumber,
  title,
  hint,
  icon: Icon,
  isActive = false,
  isComplete = false,
  children,
  className,
}: StepCardProps) => {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-6 shadow-sm transition-all duration-300",
        isActive && "ring-2 ring-primary/40 border-primary/30 shadow-md",
        isComplete && "border-primary/20 bg-primary/[0.02]",
        !isActive && !isComplete && "border-border/50",
        className
      )}
    >
      <div className="flex items-start gap-3 mb-4">
        <div
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold flex-shrink-0",
            isComplete && "bg-primary text-primary-foreground",
            isActive && "bg-primary/15 text-primary border-2 border-primary",
            !isActive && !isComplete && "bg-muted text-muted-foreground"
          )}
        >
          {isComplete ? "✓" : stepNumber}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          {hint && (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {hint}
            </p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
};
