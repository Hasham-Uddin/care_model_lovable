import { Card } from "@/components/ui/card";
import { PlayCircle } from "lucide-react";

interface VideoTutorialProps {
  videoUrl: string | string[];
  meetingNumber: number;
  title: string;
}

export const VideoTutorial = ({ videoUrl, meetingNumber, title }: VideoTutorialProps) => {
  const videos = Array.isArray(videoUrl) ? videoUrl : [videoUrl];
  
  return (
    <Card className="p-6 shadow-card bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <PlayCircle className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">
            Meeting {meetingNumber} Tutorial{videos.length > 1 ? "s" : ""}
          </h2>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
      </div>
      
      <div className={`grid gap-4 ${videos.length > 1 ? 'md:grid-cols-2' : ''}`}>
        {videos.map((url, index) => (
          <div key={index} className="space-y-2">
            {videos.length > 1 && (
              <p className="text-sm font-medium text-muted-foreground">
                Part {index + 1}
              </p>
            )}
            <div key={url} className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
              <video
                key={url}
                className="w-full h-full object-contain"
                controls
                preload="metadata"
              >
                <source src={`${url}${url.includes('?') ? '&' : '?'}v=${encodeURIComponent(url)}`} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        ))}
      </div>
      
      <p className="text-xs text-muted-foreground mt-3 text-center">
        Watch the tutorial video{videos.length > 1 ? "s" : ""} before starting the meeting activities
      </p>
    </Card>
  );
};
