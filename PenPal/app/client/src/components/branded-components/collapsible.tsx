"use client";

import * as React from "react";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { registerComponent } from "../../penpal/client";

const Collapsible = CollapsiblePrimitive.Root;

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger;

const CollapsibleContent = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.CollapsibleContent>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleContent>
>(({ children, ...props }, ref) => (
  <CollapsiblePrimitive.CollapsibleContent
    ref={ref}
    className="overflow-hidden transition-all data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
    {...props}
  >
    {children}
  </CollapsiblePrimitive.CollapsibleContent>
));

CollapsibleContent.displayName = "CollapsibleContent";

registerComponent("Collapsible", Collapsible);
registerComponent("CollapsibleTrigger", CollapsibleTrigger);
registerComponent("CollapsibleContent", CollapsibleContent);

export { Collapsible, CollapsibleTrigger, CollapsibleContent };

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default Collapsible;
