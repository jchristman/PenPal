import { registerComponent } from "../../penpal/client";
import React from "react";
import {
  Calendar,
  BarChart3,
  FileText,
  Users,
  Building,
  AlertTriangle,
  Map,
} from "lucide-react";
import { Card, CardContent } from "./card";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?:
    | "calendar"
    | "chart"
    | "document"
    | "users"
    | "client"
    | "alert"
    | "roadmap";
}

const iconMap = {
  calendar: Calendar,
  chart: BarChart3,
  document: FileText,
  users: Users,
  client: Building,
  alert: AlertTriangle,
  roadmap: Map,
};

export function EmptyState({
  title,
  description,
  icon = "document",
}: EmptyStateProps) {
  const Icon = iconMap[icon];

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-medium">{title}</h3>
        <p className="mb-6 max-w-md text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

registerComponent("EmptyState", EmptyState);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default EmptyState;
