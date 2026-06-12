import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, X } from "lucide-react";

interface InterrogationPanelProps {
  output: string;
  userPrompt: string;
  sessionId: string;
  projectId: string;
  sessionNumber?: number;
  additionalContext?: string;
  onClose: () => void;
  onRefinedOutput?: (refinedOutput: string) => void;
}

const HARM_TAGS: { label: string; value: string }[] = [
  { label: "Stereotyping", value: "stereotype" },
  { label: "Deficit Framing", value: "deficit_framing" },
  { label: "Cultural Misread", value: "cultural_misread" },
  { label: "Erasure", value: "erasure" },
  { label: "Bias", value: "bias" },
  { label: "Equity Gap", value: "equity_gap" },
  { label: "Data Misuse", value: "data_misuse" },
  { label: "Hallucination", value: "hallucination" },
];

const SESSION_REFINED_FORMATS: Record<number, string> = {
  1: "Rewrite the problem statement in exactly 3 concise sentences with an anti-racist, community-centered lens.",
  2: "List exactly 6 community groups most impacted by this problem. Format each as: '• [Group name] — [Why they are impacted] — [Key strength or asset]'. One group per line, no introductions or conclusions.",
  3: "Create a 5-item chronological timeline. Format: '• [Year] — [Event and impact]'. One per line.",
  4: "List 5-7 key stakeholders. Format: '• [Stakeholder] — [Interest/role] — [Power level: High/Med/Low]'. One per line.",
  5: "List 3-5 key data points. Format: '• [Data point with source] → [Community meaning]'. One per line.",
  6: "List 4-6 community assets. Format: '• [Category]: [Asset] — [How it serves the community]'. One per line.",
  7: "List 3-4 equity concerns. Format: '• [Concern] — [Who it affects] — [Suggested fix]'. One per line.",
  8: "List inputs and activities. Format: '• [Input/Activity] — [Purpose]'. One per line.",
  9: "List expected outcomes in 3 tiers: Short-term, Medium-term, Long-term. Bullet each outcome.",
  10: "List 3-5 community impact metrics. Format: '• [Metric] — [What it measures] — [Data source]'. One per line.",
  11: "List data collection points. Format: '• [Data point] — [Method] — [Timing]'. One per line.",
  12: "List 3-5 key insights and next steps. Format: '• [Insight] → [Next step]'. One per line.",
};

export const InterrogationPanel = ({
  output,
  userPrompt,
  sessionId,
  projectId,
  sessionNumber,
  additionalContext,
  onClose,
  onRefinedOutput,
}: InterrogationPanelProps) => {
  const [proximityAnswer, setProximityAnswer] = useState("");
  const [beliefAnswer, setBeliefAnswer] = useState("");
  const [timingAnswer, setTimingAnswer] = useState("");
  const [selectedHarmTags, setSelectedHarmTags] = useState<string[]>([]);
  const [affectedGroups, setAffectedGroups] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleHarmTag = (value: string) => {
    setSelectedHarmTags(prev => 
      prev.includes(value) ? prev.filter(t => t !== value) : [...prev, value]
    );
  };

  const handleGenerateRefinement = async () => {
    if (!proximityAnswer.trim() && !beliefAnswer.trim() && !timingAnswer.trim()) {
      toast.error("Please answer at least one TIR question");
      return;
    }

    setLoading(true);
    try {
      // Determine primary mode based on which question has the most content
      const modes = [
        { mode: "proximity" as const, length: proximityAnswer.length },
        { mode: "belief" as const, length: beliefAnswer.length },
        { mode: "timing" as const, length: timingAnswer.length }
      ];
      const primaryMode = modes.reduce((max, curr) => curr.length > max.length ? curr : max).mode;

      // Save interrogation data for training
      const interrogationData = {
        session_id: sessionId,
        project_id: projectId,
        model_output: output,
        user_prompt: userPrompt,
        mode: primaryMode,
        challenge_tags: selectedHarmTags as any[],
        affected_groups: affectedGroups.split(',').map(g => g.trim()).filter(Boolean),
        context_artifacts: {
          additional_context: additionalContext,
          proximity_answer: proximityAnswer,
          belief_answer: beliefAnswer,
          timing_answer: timingAnswer
        }
      };

      const { data: savedInterrogation, error: saveError } = await supabase
        .from('interrogations')
        .insert(interrogationData)
        .select('id')
        .single();

      if (saveError) {
        console.error("Error saving interrogation:", saveError);
        // Continue with refinement even if save fails
      }

      toast.success("Generating refined output...");

      // Build interrogation feedback
      const harmLabels = selectedHarmTags.map(value => 
        HARM_TAGS.find(tag => tag.value === value)?.label || value
      );
      
      const feedback: string[] = [];
      
      if (harmLabels.length > 0) {
        feedback.push(`IDENTIFIED HARMS: ${harmLabels.join(", ")}`);
      }
      
      if (affectedGroups.trim()) {
        feedback.push(`AFFECTED COMMUNITIES: ${affectedGroups}`);
      }
      
      if (proximityAnswer.trim()) {
        feedback.push(`PROXIMITY (Whose voices are centered/missing?): ${proximityAnswer}`);
      }
      
      if (beliefAnswer.trim()) {
        feedback.push(`BELIEF (What assumptions need challenging?): ${beliefAnswer}`);
      }
      
      if (timingAnswer.trim()) {
        feedback.push(`TIMING (What evidence/history should be considered?): ${timingAnswer}`);
      }

      const formatInstruction = sessionNumber && SESSION_REFINED_FORMATS[sessionNumber]
        ? `\n\nREQUIRED OUTPUT FORMAT:\n${SESSION_REFINED_FORMATS[sessionNumber]}`
        : "";

      const refinementPrompt = `Original user prompt: ${userPrompt}

Original AI response: ${output}

${additionalContext ? `Additional context: ${additionalContext}` : ""}

COMMUNITY-CENTERED INTERROGATION (TIR Framework):
${feedback.join("\n\n")}

Based on this community-centered feedback using Theory of Interrogative Reasoning (TIR), please generate a refined response that:
1. Addresses the identified harms: ${harmLabels.join(", ") || "none specified"}
2. Centers the voices and perspectives identified in the proximity question
3. Challenges and corrects the assumptions identified in the belief question
4. Incorporates the evidence, history, and timeline context from the timing question
5. Uses asset-based framing that honors community strengths
6. Specifically considers the impact on: ${affectedGroups || "the community"}
${formatInstruction}

Generate ONLY the refined output, no meta-commentary.`;

      const { data: aiData, error: aiError } = await supabase.functions.invoke(
        "ai-assistant",
        {
          body: {
            sessionType: "default",
            userPrompt: refinementPrompt,
          },
        }
      );

      if (aiError) {
        console.error("AI refinement error:", aiError);
        toast.error("Failed to generate refinement", {
          description: "Please try again.",
        });
        return;
      }

      const refinedOutput = aiData?.response || "";
      
      // Update the interrogation record with the refined output
      if (savedInterrogation?.id && refinedOutput) {
        await supabase
          .from('interrogations')
          .update({ 
            model_revision: refinedOutput,
            verdict: 'accept_revision' as any
          })
          .eq('id', savedInterrogation.id);
      }

      if (refinedOutput && onRefinedOutput) {
        onRefinedOutput(refinedOutput);
      }

      toast.success("Output refined through community interrogation!", {
        description: "The refined version has been added to your worksheet.",
      });
      onClose();
    } catch (error: any) {
      console.error("Refinement generation error:", error);
      toast.error("Failed to generate refinement", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-elevated">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">Community-Centered Interrogation</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Refine this output using TIR questions
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* AI Output Display */}
        <div className="mb-6">
          <Label>AI Output Being Interrogated</Label>
          <div className="mt-2 p-3 bg-muted/50 rounded-lg border border-border text-sm max-h-32 overflow-y-auto">
            {output}
          </div>
        </div>

        {/* Harm Tags */}
        <div className="mb-5">
          <Label className="mb-2 block">Identify Potential Harms (Select all that apply)</Label>
          <div className="flex flex-wrap gap-2">
            {HARM_TAGS.map((tag) => (
              <Badge
                key={tag.value}
                variant={selectedHarmTags.includes(tag.value) ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/10"
                onClick={() => toggleHarmTag(tag.value)}
              >
                {tag.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Affected Groups */}
        <div className="mb-5">
          <Label htmlFor="affected-groups">Who is most impacted by this AI-generated response?</Label>
          <Textarea
            id="affected-groups"
            value={affectedGroups}
            onChange={(e) => setAffectedGroups(e.target.value)}
            placeholder="e.g., Black youth, immigrant families, single mothers, elderly residents..."
            rows={2}
            className="mt-2"
          />
        </div>

        {/* TIR Questions */}
        <div className="space-y-5 border-t border-border pt-5">
          <h3 className="font-semibold text-sm">TIR Assessment Questions</h3>
          
          {/* Proximity Question */}
          <div>
            <Label htmlFor="proximity" className="flex items-start gap-2">
              <span className="text-primary font-semibold">Proximity:</span>
              <span className="font-normal">Whose voices should be centered? Who might be missing?</span>
            </Label>
            <Textarea
              id="proximity"
              value={proximityAnswer}
              onChange={(e) => setProximityAnswer(e.target.value)}
              placeholder="e.g., Youth voices, Indigenous elders, families most impacted..."
              rows={2}
              className="mt-2"
            />
          </div>

          {/* Belief Question */}
          <div>
            <Label htmlFor="belief" className="flex items-start gap-2">
              <span className="text-primary font-semibold">Belief:</span>
              <span className="font-normal">What assumptions or biases are embedded here?</span>
            </Label>
            <Textarea
              id="belief"
              value={beliefAnswer}
              onChange={(e) => setBeliefAnswer(e.target.value)}
              placeholder="e.g., Assumes external solutions, deficit framing, overlooks community assets..."
              rows={2}
              className="mt-2"
            />
          </div>

          {/* Timing Question */}
          <div>
            <Label htmlFor="timing" className="flex items-start gap-2">
              <span className="text-primary font-semibold">Timing:</span>
              <span className="font-normal">What historical context or evidence should be considered?</span>
            </Label>
            <Textarea
              id="timing"
              value={timingAnswer}
              onChange={(e) => setTimingAnswer(e.target.value)}
              placeholder="e.g., Policy changes from 1995, local organizing history, timeline data..."
              rows={2}
              className="mt-2"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleGenerateRefinement}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>Generating...</>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Refined Output
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};