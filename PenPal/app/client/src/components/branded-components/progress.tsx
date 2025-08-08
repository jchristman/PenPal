import { registerComponent } from "../../penpal/client";
import * as React from "react";
import { cn } from "./utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  showValue?: boolean;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, showValue = false, ...props }, ref) => {
    // Calculate percentage
    const percentage = Math.min(Math.max(0, (value / max) * 100), 100);

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className={cn(
          "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
          className
        )}
        {...props}
      >
        <div
          className="h-full w-full flex-1 bg-primary transition-all duration-300"
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        >
          {showValue && (
            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      </div>
    );
  }
);
Progress.displayName = "Progress";

registerComponent("Progress", Progress);

export { Progress };

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default Progress;
