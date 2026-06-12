import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Award, Lock, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import type { Level } from "@/config/academyContent";

interface Props {
  level: Level;
  completedLessons: number;
  totalLessons: number;
  certificateEarned: boolean;
  locked: boolean;
}

export const LevelCard = ({ level, completedLessons, totalLessons, certificateEarned, locked }: Props) => {
  const pct = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

  const inner = (
    <Card
      className={cn(
        "p-6 h-full transition-all border-2",
        locked
          ? "opacity-60 border-border"
          : certificateEarned
            ? "border-primary/40 bg-primary/[0.02] hover:shadow-lg"
            : "border-border hover:border-primary/40 hover:shadow-md",
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: `linear-gradient(135deg, ${level.badgeColor}, ${level.badgeColor}dd)` }}
        >
          {certificateEarned ? (
            <Award className="w-7 h-7 text-white" />
          ) : locked ? (
            <Lock className="w-6 h-6 text-white" />
          ) : (
            <span className="text-white font-bold text-xl">{level.number}</span>
          )}
        </div>
        {certificateEarned && (
          <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Certified
          </Badge>
        )}
        {locked && !certificateEarned && (
          <Badge variant="outline">Locked</Badge>
        )}
      </div>

      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
        Level {level.number}
      </div>
      <h3 className="text-lg font-bold leading-tight mb-1">{level.title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{level.tagline}</p>

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">
            {completedLessons} of {totalLessons} lessons
          </span>
          <span className="font-medium">{pct}%</span>
        </div>
        <Progress value={pct} className="h-2" />
      </div>

      {!locked && (
        <div className="mt-4 flex items-center text-sm font-medium text-primary">
          {completedLessons === 0 ? "Start level" : certificateEarned ? "Review" : "Continue"}
          <ArrowRight className="w-4 h-4 ml-1" />
        </div>
      )}
    </Card>
  );

  if (locked) return inner;
  return <Link to={`/academy/level/${level.id}`}>{inner}</Link>;
};
