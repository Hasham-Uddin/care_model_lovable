import { ChevronDown, History, FileText } from "lucide-react";

interface PreviousSessionReferenceProps {
  previousSessionName: string;
  previousSessionNumber: number;
  data: Record<string, string>;
  guideLabels?: { input1?: string; input2?: string; input3?: string };
}

export const PreviousSessionReference = ({
  previousSessionName,
  previousSessionNumber,
  data,
  guideLabels,
}: PreviousSessionReferenceProps) => {
  const hasData = data.input1?.trim() || data.input2?.trim() || data.input3?.trim() || data.refined?.trim();

  if (!hasData) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20 p-4">
        <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
          <History className="w-4 h-4" />
          <span>
            <strong>Meeting {previousSessionNumber}: {previousSessionName}</strong> has no saved data yet. Complete it first for continuity.
          </span>
        </div>
      </div>
    );
  }

  return (
    <details className="rounded-xl border border-primary/20 bg-primary/[0.02] group">
      <summary className="cursor-pointer flex items-center gap-2 p-4 text-sm font-medium text-foreground hover:bg-primary/5 transition-colors rounded-xl">
        <History className="w-4 h-4 text-primary flex-shrink-0" />
        <span className="flex-1">
          Reference: Meeting {previousSessionNumber} — {previousSessionName}
        </span>
        <span className="text-xs text-muted-foreground mr-1">Click to expand</span>
        <ChevronDown className="w-4 h-4 text-muted-foreground group-open:rotate-180 transition-transform" />
      </summary>

      <div className="px-4 pb-4 space-y-4 border-t border-primary/10">
        <p className="text-xs text-muted-foreground pt-3">
          These are the outputs from Part One. Use them to ensure alignment and continuity.
        </p>

        {/* Refined output (highest priority) */}
        {data.refined?.trim() && (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <FileText className="w-3.5 h-3.5 text-primary" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">
                Refined Output
              </h4>
            </div>
            <div className="bg-primary/5 border border-primary/15 rounded-lg p-3 text-sm whitespace-pre-wrap leading-relaxed">
              {data.refined}
            </div>
          </div>
        )}

        {/* Worksheet inputs */}
        {data.input1?.trim() && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-1">
              {guideLabels?.input1 || "Primary Input"}
            </h4>
            <div className="bg-muted/50 border border-border/50 rounded-lg p-3 text-sm whitespace-pre-wrap leading-relaxed">
              {data.input1}
            </div>
          </div>
        )}

        {data.input2?.trim() && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-1">
              {guideLabels?.input2 || "Additional Context"}
            </h4>
            <div className="bg-muted/50 border border-border/50 rounded-lg p-3 text-sm whitespace-pre-wrap leading-relaxed">
              {data.input2}
            </div>
          </div>
        )}

        {data.input3?.trim() && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-1">
              {guideLabels?.input3 || "Additional Notes"}
            </h4>
            <div className="bg-muted/50 border border-border/50 rounded-lg p-3 text-sm whitespace-pre-wrap leading-relaxed">
              {data.input3}
            </div>
          </div>
        )}

        {/* AI response if available */}
        {data.ai_response?.trim() && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-1">
              AI-Generated Response
            </h4>
            <div className="bg-accent/5 border border-accent/20 rounded-lg p-3 text-sm whitespace-pre-wrap leading-relaxed">
              {data.ai_response}
            </div>
          </div>
        )}
      </div>
    </details>
  );
};
