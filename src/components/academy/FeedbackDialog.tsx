import { useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { MessageSquarePlus, Bug, Lightbulb, BookOpen, Heart, MoreHorizontal, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TYPES = [
  { value: "bug", label: "Bug", icon: Bug, color: "text-destructive" },
  { value: "suggestion", label: "Suggestion", icon: Lightbulb, color: "text-amber-500" },
  { value: "content", label: "Content", icon: BookOpen, color: "text-primary" },
  { value: "praise", label: "Praise", icon: Heart, color: "text-pink-500" },
  { value: "other", label: "Other", icon: MoreHorizontal, color: "text-muted-foreground" },
];

interface Props {
  trigger?: React.ReactNode;
  defaultLessonId?: string;
  defaultLevelId?: string;
}

export const FeedbackDialog = ({ trigger, defaultLessonId, defaultLevelId }: Props) => {
  const [open, setOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState("suggestion");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const location = useLocation();
  const params = useParams();

  const handleSubmit = async () => {
    if (message.trim().length < 5) {
      toast.error("Please share a little more detail (at least 5 characters).");
      return;
    }
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You need to be signed in to submit feedback.");
      setSubmitting(false);
      return;
    }

    const lessonId = defaultLessonId ?? (params.lessonId as string | undefined) ?? null;
    const levelId = defaultLevelId ?? (params.levelId as string | undefined) ?? null;

    const { error } = await supabase.from("academy_feedback").insert({
      user_id: user.id,
      feedback_type: feedbackType,
      message: message.trim(),
      rating,
      lesson_id: lessonId,
      level_id: levelId,
      route: location.pathname,
      user_email: user.email ?? null,
    });

    setSubmitting(false);
    if (error) {
      toast.error("Couldn't send feedback. Try again.");
      return;
    }
    toast.success("Thank you — your feedback helps shape the Academy.");
    setMessage("");
    setRating(null);
    setFeedbackType("suggestion");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <MessageSquarePlus className="w-4 h-4 mr-1" /> Send Feedback
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>Help us improve the Academy</DialogTitle>
            <Badge variant="outline" className="text-[10px] uppercase tracking-wide bg-amber-500/10 text-amber-700 border-amber-500/30">
              Beta
            </Badge>
          </div>
          <DialogDescription>
            The Training Academy is in beta. Your feedback shapes what we build next.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Type */}
          <div>
            <Label className="text-sm font-medium mb-2 block">What kind of feedback?</Label>
            <RadioGroup value={feedbackType} onValueChange={setFeedbackType} className="grid grid-cols-5 gap-2">
              {TYPES.map((t) => {
                const Icon = t.icon;
                const selected = feedbackType === t.value;
                return (
                  <Label
                    key={t.value}
                    htmlFor={`fb-${t.value}`}
                    className={cn(
                      "flex flex-col items-center gap-1 p-3 rounded-lg border-2 cursor-pointer transition-all text-center",
                      selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
                    )}
                  >
                    <RadioGroupItem id={`fb-${t.value}`} value={t.value} className="sr-only" />
                    <Icon className={cn("w-5 h-5", selected ? "text-primary" : t.color)} />
                    <span className="text-xs font-medium">{t.label}</span>
                  </Label>
                );
              })}
            </RadioGroup>
          </div>

          {/* Rating */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              How's the Academy so far? <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(rating === n ? null : n)}
                  className="p-1 transition-transform hover:scale-110"
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                >
                  <Star
                    className={cn(
                      "w-7 h-7 transition-colors",
                      rating !== null && n <= rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/40",
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="fb-message" className="text-sm font-medium mb-2 block">
              Tell us more
            </Label>
            <Textarea
              id="fb-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What worked, what didn't, what's missing… anything goes."
              rows={5}
              spellCheck
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              We'll see the page you're on{(params.lessonId || params.levelId) && " and which lesson/level"}.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || message.trim().length < 5}>
            {submitting ? "Sending…" : "Send feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
