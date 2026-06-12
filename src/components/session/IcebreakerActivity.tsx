import { Card } from "@/components/ui/card";
import { Heart, Clock, MessageCircle } from "lucide-react";
import { ICEBREAKER_CONTENT } from "@/config/icebreakerContent";

interface IcebreakerActivityProps {
  meetingNumber: number;
}

export const IcebreakerActivity = ({ meetingNumber }: IcebreakerActivityProps) => {
  const content = ICEBREAKER_CONTENT[meetingNumber];
  if (!content) return null;

  return (
    <Card className="p-6 shadow-card border-accent/30 bg-gradient-to-br from-accent/10 to-primary/5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
          <Heart className="w-5 h-5 text-accent-foreground" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold">Ice Breaker</h2>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>5 minutes</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <MessageCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm font-semibold">{content.prompt}</p>
        </div>
        <p className="text-sm text-muted-foreground pl-6">{content.instruction}</p>
      </div>
    </Card>
  );
};
