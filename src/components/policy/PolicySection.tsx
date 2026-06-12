import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface PolicySectionProps {
  icon?: LucideIcon;
  title: string;
  children: React.ReactNode;
  variant?: "default" | "primary" | "destructive" | "secondary";
  id?: string;
}

export const PolicySection = ({ icon: Icon, title, children, variant = "default", id }: PolicySectionProps) => {
  const variantClasses = {
    default: "",
    primary: "border-primary/20 bg-primary/[0.02]",
    destructive: "border-destructive/20 bg-destructive/[0.02]",
    secondary: "border-secondary/20 bg-secondary/[0.02]",
  };

  return (
    <Card id={id} className={`p-8 mb-8 ${variantClasses[variant]}`}>
      <div className="flex items-center gap-3 mb-4">
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        )}
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
      </div>
      {children}
    </Card>
  );
};

export const PolicyList = ({ items }: { items: string[] }) => (
  <ul className="space-y-2 mb-4">
    {items.map((item, i) => (
      <li key={i} className="flex items-start gap-2 text-muted-foreground">
        <span className="text-primary mt-1">•</span> {item}
      </li>
    ))}
  </ul>
);

export const PolicyQuote = ({ children }: { children: React.ReactNode }) => (
  <blockquote className="border-l-4 border-secondary pl-4 italic text-foreground font-medium my-4">
    {children}
  </blockquote>
);
