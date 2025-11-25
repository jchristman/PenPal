import React from "react";
import { Components, registerComponent } from "@penpal/core";

const { Progress } = Components;

interface ProgressBarProps {
  value: number;
  max?: number;
  unit?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  unit = "%",
}) => {
  if (value === undefined || value === null) {
    return null;
  }

  const normalizedValue = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div className="flex items-center w-full">
      <div className="w-full mr-1">
        <Progress value={normalizedValue} />
      </div>
      <div className="min-w-[40px]">
        <p className="text-sm text-muted-foreground">
          {`${Math.round(value)}${unit}`}
        </p>
      </div>
    </div>
  );
};

registerComponent("UIDirectiveProgressBar", ProgressBar);

export default ProgressBar;
