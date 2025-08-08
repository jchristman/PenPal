import * as React from "react";
import { Link } from "react-router-dom";
import { registerComponent } from "../../penpal/client";
import { Button } from "./button";
import { cn } from "./utils";

export interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  return (
    <div className={cn("bg-background", className)}>
      <nav className="flex items-center gap-0 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <div key={item.href} className="flex items-center">
              {index > 0 && (
                <span className="mx-1 text-muted-foreground">/</span>
              )}
              {isLast ? (
                <Button
                  variant="ghost"
                  className="pointer-events-none font-medium text-primary"
                >
                  {item.icon && <span className="mr-1">{item.icon}</span>}
                  {item.label}
                </Button>
              ) : (
                <Button variant="ghost" asChild className="gap-1">
                  <Link to={item.href}>
                    {item.icon && <span className="mr-1">{item.icon}</span>}
                    {item.label}
                  </Link>
                </Button>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}

registerComponent("Breadcrumb", Breadcrumb);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default Breadcrumb;
