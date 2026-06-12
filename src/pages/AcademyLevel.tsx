import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle2, Circle, Clock, Award, ArrowRight, MessageSquarePlus } from "lucide-react";
import { getLevel, LEVELS } from "@/config/academyContent";
import { FeedbackDialog } from "@/components/academy/FeedbackDialog";
import { supabase } from "@/integrations/supabase/client";

export default function AcademyLevel() {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();
  const level = levelId ? getLevel(levelId) : null;
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [hasCert, setHasCert] = useState(false);

  useEffect(() => {
    if (!level) return;
    void load();
  }, [levelId]);

  const load = async () => {
    if (!level) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: prog }, { data: cert }] = await Promise.all([
      supabase
        .from("academy_progress")
        .select("lesson_id,status")
        .eq("user_id", user.id)
        .eq("level_id", level.id),
      supabase.from("academy_certificates").select("id").eq("user_id", user.id).eq("level_id", level.id).maybeSingle(),
    ]);
    setCompleted(new Set((prog ?? []).filter((p) => p.status === "completed").map((p) => p.lesson_id)));
    setHasCert(!!cert);
  };

  if (!level) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-muted-foreground">Level not found.</div>
      </DashboardLayout>
    );
  }

  const completedCount = level.lessons.filter((l) => completed.has(l.id)).length;
  const pct = Math.round((completedCount / level.lessons.length) * 100);
  const allDone = completedCount === level.lessons.length;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/academy"><ArrowLeft className="w-4 h-4 mr-1" /> Back to Academy</Link>
          </Button>
          <FeedbackDialog
            trigger={
              <Button variant="ghost" size="sm">
                <MessageSquarePlus className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Feedback</span>
              </Button>
            }
          />
        </div>

        {/* Hero */}
        <Card className="p-8" style={{ borderTop: `4px solid ${level.badgeColor}` }}>
          <div className="flex items-start gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: level.badgeColor }}
            >
              {hasCert ? (
                <Award className="w-8 h-8 text-white" />
              ) : (
                <span className="text-white font-bold text-2xl">{level.number}</span>
              )}
            </div>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Level {level.number}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mt-1">{level.title}</h1>
              <p className="text-muted-foreground mt-2">{level.description}</p>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{completedCount} of {level.lessons.length} lessons complete</span>
              <span className="font-semibold">{pct}%</span>
            </div>
            <Progress value={pct} />
          </div>

          {hasCert && (
            <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Certificate earned. Download from your Academy home.</span>
            </div>
          )}
        </Card>

        {/* Lessons */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Lessons</h2>
          <div className="space-y-3">
            {level.lessons.map((lesson, idx) => {
              const isDone = completed.has(lesson.id);
              const prevDone = idx === 0 || completed.has(level.lessons[idx - 1].id);
              const locked = !prevDone && !isDone;
              return (
                <Card
                  key={lesson.id}
                  className={`p-4 transition-all ${locked ? "opacity-60" : "hover:shadow-md cursor-pointer"}`}
                  onClick={() => !locked && navigate(`/academy/lesson/${lesson.id}`)}
                >
                  <div className="flex items-center gap-4">
                    {isDone ? (
                      <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                    ) : (
                      <Circle className="w-6 h-6 text-muted-foreground shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Lesson {idx + 1}</span>
                        {locked && <Badge variant="outline" className="text-[10px]">Locked</Badge>}
                        {isDone && <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">Complete</Badge>}
                      </div>
                      <div className="font-semibold">{lesson.title}</div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {lesson.estMinutes} min</span>
                        <span>{lesson.quiz.length} question check</span>
                      </div>
                    </div>
                    {!locked && <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Next steps */}
        {allDone && !hasCert && (
          <Card className="p-6 border-2 border-primary/30 bg-primary/[0.03] text-center">
            <Award className="w-10 h-10 text-primary mx-auto mb-2" />
            <h3 className="text-xl font-bold">All lessons complete</h3>
            <p className="text-muted-foreground mt-1">
              Your certificate will be awarded automatically when you finish the last lesson's check.
            </p>
          </Card>
        )}

        {hasCert && LEVELS[level.number] && (
          <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <div className="flex items-center gap-3">
              <ArrowRight className="w-6 h-6 text-primary" />
              <div className="flex-1">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Next Level Unlocked</div>
                <div className="font-semibold">Level {LEVELS[level.number].number}: {LEVELS[level.number].title}</div>
              </div>
              <Button asChild>
                <Link to={`/academy/level/${LEVELS[level.number].id}`}>Continue</Link>
              </Button>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
