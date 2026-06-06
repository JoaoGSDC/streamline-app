import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-caption font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary-container text-[hsl(var(--on-primary-container))] shadow-glow-purple",
        secondary:
          "border-transparent bg-secondary-container/20 text-secondary shadow-glow-cyan",
        destructive:
          "border-transparent bg-error-container text-[hsl(var(--on-error-container))]",
        outline:
          "border-outline-variant/50 text-foreground bg-surface-container-low/50",
        active:
          "border-transparent bg-[hsl(var(--badge-active-bg))] text-[hsl(var(--badge-active-text))] shadow-none",
        inactive:
          "border-transparent bg-[hsl(var(--badge-inactive-bg))] text-[hsl(var(--badge-inactive-text))] shadow-none",
        featured:
          "border-transparent bg-[hsl(var(--badge-featured-bg))] text-[hsl(var(--badge-featured-text))] shadow-none",
        draft:
          "border border-dashed border-[hsl(var(--badge-draft-border)/0.5)] bg-transparent text-muted-foreground shadow-none",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
