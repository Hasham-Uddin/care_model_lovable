import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Trophy, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { PASS_THRESHOLD, type QuizQuestion } from "@/config/academyContent";

interface Props {
  questions: QuizQuestion[];
  onPass: (score: number) => void;
}

export const KnowledgeCheck = ({ questions, onPass }: Props) => {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = Object.keys(answers).length === questions.length;
  const correctCount = Object.entries(answers).filter(
    ([i, v]) => questions[Number(i)].correctIndex === v,
  ).length;
  const score = correctCount / questions.length;
  const passed = score >= PASS_THRESHOLD;

  const handleSubmit = () => {
    setSubmitted(true);
    if (score >= PASS_THRESHOLD) onPass(score);
  };

  const reset = () => {
    setAnswers({});
    setSubmitted(false);
  };

  return (
    <Card className="p-6 border-2 border-primary/20">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold">Knowledge Check</h3>
          <p className="text-sm text-muted-foreground">
            Score {Math.round(PASS_THRESHOLD * 100)}% or higher to complete this lesson.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {questions.map((q, qi) => {
          const userAns = answers[qi];
          const isCorrect = submitted && userAns === q.correctIndex;
          const isWrong = submitted && userAns !== undefined && userAns !== q.correctIndex;
          return (
            <div
              key={qi}
              className={cn(
                "p-4 rounded-lg border-2 transition-colors",
                isCorrect && "border-green-500/40 bg-green-500/5",
                isWrong && "border-destructive/40 bg-destructive/5",
                !submitted && "border-border",
              )}
            >
              <div className="flex items-start gap-2 mb-3">
                <span className="text-sm font-semibold text-muted-foreground">{qi + 1}.</span>
                <p className="font-medium">{q.q}</p>
                {isCorrect && <CheckCircle2 className="w-5 h-5 text-green-600 ml-auto shrink-0" />}
                {isWrong && <XCircle className="w-5 h-5 text-destructive ml-auto shrink-0" />}
              </div>
              <RadioGroup
                value={userAns?.toString() ?? ""}
                onValueChange={(v) => !submitted && setAnswers({ ...answers, [qi]: Number(v) })}
                disabled={submitted}
              >
                {q.options.map((opt, oi) => {
                  const isThisCorrect = submitted && oi === q.correctIndex;
                  return (
                    <div
                      key={oi}
                      className={cn(
                        "flex items-start gap-2 p-2 rounded",
                        isThisCorrect && "bg-green-500/10",
                      )}
                    >
                      <RadioGroupItem value={oi.toString()} id={`q${qi}-o${oi}`} className="mt-0.5" />
                      <Label
                        htmlFor={`q${qi}-o${oi}`}
                        className={cn(
                          "cursor-pointer leading-relaxed",
                          isThisCorrect && "font-semibold",
                        )}
                      >
                        {opt}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
              {submitted && q.explanation && (
                <p className="text-xs text-muted-foreground mt-3 italic">{q.explanation}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        {submitted ? (
          <>
            <div>
              <p className="text-2xl font-bold">
                {correctCount} / {questions.length}{" "}
                <span className={passed ? "text-green-600" : "text-destructive"}>
                  ({Math.round(score * 100)}%)
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                {passed
                  ? "Lesson complete. Great work."
                  : `You need ${Math.round(PASS_THRESHOLD * 100)}% to pass. Review and try again.`}
              </p>
            </div>
            {!passed && (
              <Button variant="outline" onClick={reset}>
                <RotateCcw className="w-4 h-4 mr-2" /> Try Again
              </Button>
            )}
          </>
        ) : (
          <Button onClick={handleSubmit} disabled={!allAnswered} size="lg" className="ml-auto">
            Submit Answers
          </Button>
        )}
      </div>
    </Card>
  );
};
