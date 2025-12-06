import React from "react";
import { JsonView } from "react-json-view-lite";
import { Components, registerComponent } from "@penpal/core";

const { Card } = Components;

interface JsonTreeProps {
  value: any;
  maxDepth?: number;
  collapsed?: boolean;
}

const JsonTree: React.FC<JsonTreeProps> = ({
  value,
  maxDepth = 2,
  collapsed = false,
}) => {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  return (
    <Card className="p-4">
      <JsonView
        data={value}
        style={
          {
            fontSize: "0.875rem",
          } as any
        }
      />
    </Card>
  );
};

registerComponent("UIDirectiveJsonTree", JsonTree);

export default JsonTree;
