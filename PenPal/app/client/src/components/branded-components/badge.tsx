import { registerComponent } from "../../penpal/client";
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { COLORS } from "./colors";

import { cn } from "./utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        warning: `border-transparent bg-${COLORS.STATUS.WARNING} text-orange-50 hover:bg-orange-500/80`,
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success: `border-transparent bg-${COLORS.STATUS.SUCCESS} text-success-foreground hover:bg-${COLORS.STATUS.SUCCESS}/80`,
        error: `border-transparent bg-${COLORS.STATUS.ERROR} text-error-foreground hover:bg-${COLORS.STATUS.ERROR}/80`,
        informational: `border-transparent bg-severity-informational text-severity-informational-foreground hover:bg-severity-informational/80`,
        low: `border-transparent bg-severity-low text-severity-low-foreground hover:bg-severity-low/80`,
        medium: `border-transparent bg-severity-medium text-severity-medium-foreground hover:bg-severity-medium/80`,
        high: `border-transparent bg-severity-high text-severity-high-foreground hover:bg-severity-high/80`,
        critical: `border-transparent bg-severity-critical text-severity-critical-foreground hover:bg-severity-critical/80`,
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

registerComponent("Badge", Badge);

export { Badge, badgeVariants };

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default Badge;
