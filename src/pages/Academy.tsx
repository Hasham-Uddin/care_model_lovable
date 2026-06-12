import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, Award, Sparkles, ArrowRight, Download, MessageSquarePlus } from "lucide-react";
import { LevelCard } from "@/components/academy/LevelCard";
import { FeedbackDialog } from "@/components/academy/FeedbackDialog";
import { LEVELS, ALL_LESSONS } from "@/config/academyContent";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { downloadCertificate } from "@/utils/generateCertificate";
import { toast } from "sonner";

interface ProgressRow {
  lesson_id: string;
  level_id: string;
  status: string;
}

interface CertRow {
  id: string;
  level_id: string;
  level_title: string;
  learner_name: string;
  score: number;
  awarded_at: string;
  verification_code: string;
}

export default function Academy() {
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [certs, setCerts] = useState<CertRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: prog }, { data: cs }] = await Promise.all([
      supabase.from("academy_progress").select("lesson_id,level_id,status").eq("user_id", user.id),
      supabase.from("academy_certificates").select("*").eq("user_id", user.id).order("awarded_at", { ascending: false }),
    ]);
    setProgress(prog ?? []);
    setCerts((cs ?? []) as CertRow[]);
    setLoading(false);
  };

  const completedLessonIds = new Set(progress.filter((p) => p.status === "completed").map((p) => p.lesson_id));
  const certifiedLevelIds = new Set(certs.map((c) => c.level_id));

  const totalLessons = ALL_LESSONS.length;
  const completedTotal = ALL_LESSONS.filter((l) => completedLessonIds.has(l.id)).length;
  const overallPct = Math.round((completedTotal / totalLessons) * 100);

  // Find next lesson to continue
  let nextLesson: typeof ALL_LESSONS[number] | null = null;
  for (let li = 0; li < LEVELS.length; li++) {
    const lvl = LEVELS[li];
    const prevLvl = LEVELS[li - 1];
    const unlocked = li === 0 || (prevLvl && certifiedLevelIds.has(prevLvl.id));
    if (!unlocked) break;
    const lesson = lvl.lessons.find((l) => !completedLessonIds.has(l.id));
    if (lesson) {
      nextLesson = { ...lesson, levelId: lvl.id, levelTitle: lvl.title, levelNumber: lvl.number };
      break;
    }
  }

  const handleDownloadCert = async (c: CertRow) => {
    try {
      await downloadCertificate({
        learnerName: c.learner_name,
        levelTitle: c.level_title,
        levelNumber: LEVELS.find((l) => l.id === c.level_id)?.number ?? 0,
        awardedAt: new Date(c.awarded_at),
        verificationCode: c.verification_code,
        score: Number(c.score),
      });
    } catch (e) {
      toast.error("Failed to generate certificate");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-8">
        {/* Hero */}
        <div className="rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground p-8 md:p-10 shadow-lg">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-3xl md:text-4xl font-bold leading-tight">
                    Facilitator Training Academy
                  </h1>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-400/30 text-amber-50 border border-amber-300/40">
                    Beta
                  </span>
                </div>
                <p className="text-white/80 mt-1 max-w-2xl">
                  Level up your community-based facilitation. Complete guided lessons, pass knowledge checks, and earn certificates.
                </p>
              </div>
            </div>
            <FeedbackDialog
              trigger={
                <Button variant="secondary" size="sm" className="shrink-0 hidden sm:inline-flex">
                  <MessageSquarePlus className="w-4 h-4 mr-1" /> Feedback
                </Button>
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="text-xs uppercase tracking-wide text-white/70">Overall Progress</div>
              <div className="text-3xl font-bold mt-1">{overallPct}%</div>
              <Progress value={overallPct} className="mt-2 h-1.5 bg-white/20" />
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="text-xs uppercase tracking-wide text-white/70">Lessons Completed</div>
              <div className="text-3xl font-bold mt-1">{completedTotal} <span className="text-base font-normal text-white/70">/ {totalLessons}</span></div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="text-xs uppercase tracking-wide text-white/70">Certificates Earned</div>
              <div className="text-3xl font-bold mt-1">{certs.length} <span className="text-base font-normal text-white/70">/ {LEVELS.length}</span></div>
            </div>
          </div>

          {nextLesson && (
            <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white/10 backdrop-blur rounded-xl p-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-white/70 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Continue where you left off
                </div>
                <div className="font-semibold mt-0.5">
                  Level {nextLesson.levelNumber} · {nextLesson.title}
                </div>
              </div>
              <Button asChild size="lg" variant="secondary" className="shrink-0">
                <Link to={`/academy/lesson/${nextLesson.id}`}>
                  Resume <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          )}
          {!nextLesson && certs.length === LEVELS.length && (
            <div className="mt-6 bg-white/15 backdrop-blur rounded-xl p-4 text-center">
              <Award className="w-8 h-8 mx-auto mb-2" />
              <div className="font-semibold">You've completed every level. You're a certified community facilitator.</div>
            </div>
          )}
        </div>

        {/* Levels */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Learning Path</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {LEVELS.map((level, idx) => {
              const prev = LEVELS[idx - 1];
              const locked = idx > 0 && prev && !certifiedLevelIds.has(prev.id);
              const completed = level.lessons.filter((l) => completedLessonIds.has(l.id)).length;
              return (
                <LevelCard
                  key={level.id}
                  level={level}
                  completedLessons={completed}
                  totalLessons={level.lessons.length}
                  certificateEarned={certifiedLevelIds.has(level.id)}
                  locked={!!locked}
                />
              );
            })}
          </div>
        </div>

        {/* Certificates */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Award className="w-6 h-6 text-primary" /> My Certificates
          </h2>
          {certs.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground border-dashed">
              No certificates yet. Complete a level to earn your first.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {certs.map((c) => {
                const lvl = LEVELS.find((l) => l.id === c.level_id);
                return (
                  <Card key={c.id} className="p-5 border-2 border-primary/20">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                      style={{ background: lvl?.badgeColor ?? "#253B96" }}
                    >
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-xs text-muted-foreground">Level {lvl?.number}</div>
                    <div className="font-semibold leading-tight">{c.level_title}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Awarded {new Date(c.awarded_at).toLocaleDateString()} · Score {Math.round(Number(c.score) * 100)}%
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground mt-2">
                      ID: {c.verification_code}
                    </div>
                    <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => handleDownloadCert(c)}>
                      <Download className="w-3 h-3 mr-1" /> Download PDF
                    </Button>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
