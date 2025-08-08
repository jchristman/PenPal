import { registerComponent } from "../../penpal/client";
import React from "react";
import { cn } from "./utils";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = "md", ...props }, ref) => {
    const sizeClasses = {
      sm: "h-4 w-4 border-2",
      md: "h-8 w-8 border-3",
      lg: "h-12 w-12 border-4",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "inline-block animate-spin rounded-full border-solid border-current border-t-transparent text-primary",
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);

Spinner.displayName = "Spinner";

registerComponent("Spinner", Spinner);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default Spinner;
