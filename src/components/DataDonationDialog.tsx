import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info, Heart, Shield, DollarSign, Users } from "lucide-react";

interface DataDonationDialogProps {
  children: React.ReactNode;
}

export const DataDonationDialog = ({ children }: DataDonationDialogProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            Our Data Contribution Philosophy
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Video Section */}
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted border-2 border-dashed border-primary/30">
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <Users className="h-12 w-12 mb-3 text-primary/50" />
              <p className="text-sm font-medium">Community Story Video</p>
              <p className="text-xs">Coming Soon</p>
            </div>
            {/* When video is ready, replace the above with:
            <video
              className="w-full h-full object-contain"
              controls
              preload="metadata"
            >
              <source src="/videos/data-donation-explainer.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            */}
          </div>

          {/* Introduction */}
          <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg p-5 border border-primary/20">
            <p className="text-base leading-relaxed">
              At the heart of our mission is a revolutionary approach to AI training data—one that 
              centers the voices, experiences, and expertise of the communities most impacted by 
              algorithmic bias. We believe that those closest to the problem hold the solutions, 
              and their insights are invaluable in creating AI systems that truly serve everyone.
            </p>
          </div>

          {/* The 3 C's */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-center">
              Our Commitment: The Three C's
            </h3>
            <div className="grid gap-4">
              {/* Credit */}
              <div className="flex gap-4 p-4 rounded-lg bg-card border shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-primary">Credit</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Every contribution matters and deserves recognition. We ensure that community 
                    members who share their lived experiences receive proper attribution for their 
                    role in shaping more equitable AI. Your voice isn't just data—it's expertise 
                    that transforms technology.
                  </p>
                </div>
              </div>

              {/* Consent */}
              <div className="flex gap-4 p-4 rounded-lg bg-card border shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-accent">Consent</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Your data, your choice—always. We operate on an opt-in model where you decide 
                    if and how your contributions are used. Consent can be revoked at any time, 
                    and all shared data is anonymized to protect your privacy while preserving 
                    the power of your insights.
                  </p>
                </div>
              </div>

              {/* Compensation */}
              <div className="flex gap-4 p-4 rounded-lg bg-card border shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-secondary">Compensation</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Community knowledge has real value, and we're committed to ensuring that value
                    flows back to the communities who create it. Organizations that contribute
                    anti-bias training data are recognized as partners in shaping more equitable AI,
                    and we are building pathways to ensure that contribution is meaningfully
                    acknowledged and rewarded over time.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground italic">
              Together, we're building a future where AI learns from community wisdom—ethically, 
              transparently, and with shared benefit for all.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
