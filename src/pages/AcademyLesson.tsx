import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, BookOpen, Target, Award, CheckCircle2, MessageSquarePlus } from "lucide-react";
import { getLessonWithLevel, LEVELS } from "@/config/academyContent";
import { KnowledgeCheck } from "@/components/academy/KnowledgeCheck";
import { FeedbackDialog } from "@/components/academy/FeedbackDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { downloadCertificate } from "@/utils/generateCertificate";

function renderBody(body: string) {
  const blocks = body.split(/\n\n+/);
  return blocks.map((block, bi) => {
    const lines = block.split("\n");
    const isList = lines.every((l) => l.trim().startsWith("- ") || l.trim() === "");
    if (isList) {
      return (
        <ul key={bi} className="list-disc pl-5 space-y-1.5 text-foreground/90">
          {lines.filter((l) => l.trim()).map((l, i) => (
            <li key={i}>{l.replace(/^\s*-\s*/, "")}</li>
          ))}
        </ul>
      );
    }
    return (
      <p key={bi} className="leading-relaxed text-foreground/90 whitespace-pre-line">
        {block}
      </p>
    );
  });
}

export default function AcademyLesson() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const data = useMemo(() => (lessonId ? getLessonWithLevel(lessonId) : null), [lessonId]);
  const [readyForQuiz, setReadyForQuiz] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [savingCert, setSavingCert] = useState(false);

  useEffect(() => {
    setReadyForQuiz(false);
    setCompleted(false);
    if (data) void markStarted();
  }, [lessonId]);

  const markStarted = async () => {
    if (!data) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("academy_progress").upsert(
      {
        user_id: user.id,
        lesson_id: data.lesson.id,
        level_id: data.level.id,
        status: "in_progress",
      },
      { onConflict: "user_id,lesson_id" },
    );
  };

  const handlePass = async (score: number) => {
    if (!data) return;
    setCompleted(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("academy_progress").upsert(
      {
        user_id: user.id,
        lesson_id: data.lesson.id,
        level_id: data.level.id,
        status: "completed",
        score,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_id" },
    );

    // Check if level is now complete -> award certificate
    const { data: levelProgress } = await supabase
      .from("academy_progress")
      .select("lesson_id,status")
      .eq("user_id", user.id)
      .eq("level_id", data.level.id);

    const completedIds = new Set((levelProgress ?? []).filter((p) => p.status === "completed").map((p) => p.lesson_id));
    completedIds.add(data.lesson.id);
    const allDone = data.level.lessons.every((l) => completedIds.has(l.id));

    if (allDone) {
      setSavingCert(true);
      const { data: existing } = await supabase
        .from("academy_certificates")
        .select("id")
        .eq("user_id", user.id)
        .eq("level_id", data.level.id)
        .maybeSingle();

      if (!existing) {
        // Compute average score across this level's lessons
        const allScores = (levelProgress ?? [])
          .filter((p) => p.status === "completed")
          .map((p: any) => Number(p.score ?? 0));
        allScores.push(score);
        const avg = allScores.reduce((a, b) => a + b, 0) / allScores.length;

        // Get learner name from profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name,email")
          .eq("id", user.id)
          .maybeSingle();
        const learnerName = profile?.full_name || profile?.email || "Facilitator";

        const { data: inserted } = await supabase
          .from("academy_certificates")
          .insert({
            user_id: user.id,
            level_id: data.level.id,
            level_title: data.level.title,
            learner_name: learnerName,
            score: avg,
          })
          .select()
          .single();

        if (inserted) {
          toast.success(`Certificate earned: Level ${data.level.number}!`, {
            description: "Your PDF is downloading now.",
          });
          try {
            await downloadCertificate({
              learnerName,
              levelTitle: data.level.title,
              levelNumber: data.level.number,
              awardedAt: new Date(inserted.awarded_at),
              verificationCode: inserted.verification_code,
              score: Number(inserted.score),
            });
          } catch (e) {
            console.error(e);
          }
        }
      }
      setSavingCert(false);
    } else {
      toast.success("Lesson complete!");
    }
  };

  if (!data) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-muted-foreground">Lesson not found.</div>
      </DashboardLayout>
    );
  }

  const { lesson, level, indexInLevel, next } = data;
  const lessonNum = indexInLevel + 1;
  const totalInLevel = level.lessons.length;
  const lessonProgressPct = readyForQuiz ? 100 : Math.round((1 / (lesson.sections.length + 1)) * 100); // simple visual

  return (
    <DashboardLayout>
      {/* Sticky progress bar */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/academy/level/${level.id}`}><ArrowLeft className="w-4 h-4 mr-1" /> Level {level.number}</Link>
          </Button>
          <div className="flex-1">
            <div className="text-xs text-muted-foreground mb-1">
              Lesson {lessonNum} of {totalInLevel} · {lesson.estMinutes} min
            </div>
            <Progress value={lessonProgressPct} className="h-1.5" />
          </div>
          <FeedbackDialog
            trigger={
              <Button variant="ghost" size="sm" className="shrink-0" title="Send feedback on this lesson">
                <MessageSquarePlus className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Feedback</span>
              </Button>
            }
          />
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 md:p-8 space-y-6">
        {/* Title */}
        <div>
          <Badge variant="outline" className="mb-2">Level {level.number}: {level.title}</Badge>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">{lesson.title}</h1>
        </div>

        {/* Objectives */}
        <Card className="p-5 bg-accent/5 border-accent/20">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-accent-foreground" />
            <h2 className="font-semibold">By the end of this lesson, you will be able to:</h2>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {lesson.objectives.map((o, i) => <li key={i}>{o}</li>)}
          </ul>
        </Card>

        {/* Sections */}
        <div className="space-y-6">
          {lesson.sections.map((sec, si) => (
            <Card key={si} className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                  {si + 1}
                </div>
                <h3 className="text-lg font-semibold">{sec.heading}</h3>
              </div>
              <div className="space-y-3 text-[15px]">{renderBody(sec.body)}</div>
            </Card>
          ))}
        </div>

        {/* Ready for check */}
        {!readyForQuiz ? (
          <Card className="p-6 text-center border-2 border-dashed">
            <BookOpen className="w-8 h-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold">Ready to check what you've learned?</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              {lesson.quiz.length} multiple-choice questions. You can retake if needed.
            </p>
            <Button size="lg" onClick={() => setReadyForQuiz(true)}>
              Start Knowledge Check <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Card>
        ) : (
          <KnowledgeCheck questions={lesson.quiz} onPass={handlePass} />
        )}

        {/* Completion CTA */}
        {completed && (
          <Card className="p-6 border-2 border-primary/30 bg-primary/[0.03]">
            <div className="flex items-start gap-3">
              {savingCert ? (
                <Award className="w-6 h-6 text-primary shrink-0 animate-pulse" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
              )}
              <div className="flex-1">
                <h3 className="font-semibold">Lesson complete</h3>
                <p className="text-sm text-muted-foreground">
                  {savingCert ? "Awarding your level certificate…" : "Nice work. Keep your momentum going."}
                </p>
              </div>
              {next ? (
                <Button asChild>
                  <Link to={`/academy/lesson/${next.id}`}>Next Lesson <ArrowRight className="w-4 h-4 ml-1" /></Link>
                </Button>
              ) : LEVELS[level.number] ? (
                <Button asChild>
                  <Link to={`/academy/level/${LEVELS[level.number].id}`}>Next Level <ArrowRight className="w-4 h-4 ml-1" /></Link>
                </Button>
              ) : (
                <Button asChild variant="outline">
                  <Link to="/academy">Back to Academy</Link>
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
