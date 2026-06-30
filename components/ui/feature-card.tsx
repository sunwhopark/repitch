import * as React from "react";
import { cn } from "@/lib/utils";

type FeatureCardProps = {
  icon: React.ReactNode;
  // Accepts a ReactNode so the title can span multiple lines.
  title: React.ReactNode;
  description: string;
  className?: string;
};

export function FeatureCard({ icon, title, description, className }: FeatureCardProps) {
  return (
    <div
      className={cn(
        "group flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-lg",
        className
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-foreground">
        {icon}
      </div>
      <h3 className="text-lg font-semibold leading-snug">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}
