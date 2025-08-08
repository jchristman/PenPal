import React from "react";
import { Components, Utils, registerComponent } from "@penpal/core";
import { ArrowUpIcon } from "lucide-react";

const { Card, CardContent } = Components;
const { cn } = Utils;

const TrendingStatistic = ({
  title = "",
  value = 0,
  delta = 0,
  caption = "",
}) => {
  const is_positive_delta = delta >= 0;

  return (
    <Card className="h-full bg-white">
      <CardContent className="p-6">
        <div className="flex justify-between items-start space-x-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
              {title}
            </p>
            <h4
              className={cn(
                "text-2xl font-bold",
                value >= 0 ? "text-green-700" : "text-red-700"
              )}
            >
              {value}
            </h4>
          </div>
        </div>

        <div className="mt-4 flex items-center space-x-2">
          <ArrowUpIcon
            className={cn(
              "h-4 w-4",
              is_positive_delta ? "text-green-700" : "text-red-700 rotate-180"
            )}
          />
          <span
            className={cn(
              "text-lg font-semibold",
              is_positive_delta ? "text-green-700" : "text-red-700"
            )}
          >
            {delta}
          </span>
          <span className="text-sm text-muted-foreground ml-2">{caption}</span>
        </div>
      </CardContent>
    </Card>
  );
};

registerComponent("DashboardTrendingStatistic", TrendingStatistic);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default TrendingStatistic;
