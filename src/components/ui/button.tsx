import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded text-body-sm font-medium font-headline ring-offset-background transition-all duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "btn-primary-glow border-0 text-primary-foreground shadow-glow-purple hover:shadow-glow-purple-lg",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-glow-purple",
        outline:
          "btn-glass border border-outline-variant/50 bg-surface-container-low/80 text-foreground hover:border-secondary-container/50 hover:shadow-glow-cyan",
        secondary:
          "glass-panel border border-outline-variant/40 bg-surface-elevated/80 text-secondary hover:border-secondary-container/40 hover:shadow-glow-cyan",
        ghost:
          "text-muted-foreground hover:bg-surface-container-high hover:text-foreground",
        "nav-login":
          "border-0 bg-transparent text-foreground shadow-none transition-[color,background-color,opacity] duration-200 hover:bg-surface-container-high/40 hover:text-primary hover:shadow-none active:scale-100",
        link: "text-primary underline-offset-4 hover:underline",
        twitch:
          "bg-twitch text-primary-foreground shadow-glow-purple hover:bg-twitch/90 hover:shadow-glow-purple-lg",
      },
      size: {
        default: "h-12 px-8",
        sm: "h-10 px-4 text-body-sm",
        lg: "h-14 px-10 text-body-md",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
