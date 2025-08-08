import React from "react";
import { JsonView } from "react-json-view-lite";
import { Components, registerComponent } from "@penpal/core";

const { Card } = Components;

const JsonTree = ({ value, maxDepth = 2, collapsed = false }) => {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  return (
    <Card className="p-4">
      <JsonView
        data={value}
        style={{
          background: "transparent",
          padding: "8px",
          fontSize: "0.875rem",
        }}
      />
    </Card>
  );
};

registerComponent("UIDirectiveJsonTree", JsonTree);

export default JsonTree;
