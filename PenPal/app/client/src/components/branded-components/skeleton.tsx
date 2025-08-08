import { registerComponent } from "../../penpal/client";
import { cn } from "./utils";
import * as React from "react";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

registerComponent("Skeleton", Skeleton);

export { Skeleton };

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default Skeleton;
