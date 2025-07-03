import React from "react";
import ReactJson from "react-json-view";
import { Components, registerComponent } from "@penpal/core";

const { Card } = Components;

const JsonTree = ({ value, maxDepth = 2, collapsed = false }) => {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  return (
    <Card>
      <ReactJson
        src={value}
        theme="monokai"
        collapsed={collapsed ? maxDepth : false}
        collapseStringsAfterLength={50}
        displayObjectSize={true}
        displayDataTypes={false}
        name={false}
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
