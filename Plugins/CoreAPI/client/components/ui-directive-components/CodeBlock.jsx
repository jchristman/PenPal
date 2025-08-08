import React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Components, registerComponent } from "@penpal/core";

const { Card } = Components;

const CodeBlock = ({
  value,
  language = "text",
  maxHeight = "400px",
  collapsible = false,
}) => {
  if (value === undefined || value === null) {
    return null;
  }

  // TODO: Add collapsibility feature

  return (
    <Card>
      <SyntaxHighlighter
        language={language.toLowerCase()}
        style={vscDarkPlus}
        showLineNumbers
        wrapLines={true}
        customStyle={{
          margin: 0,
          maxHeight,
          overflow: "auto",
          fontSize: "0.875rem",
        }}
      >
        {String(value)}
      </SyntaxHighlighter>
    </Card>
  );
};

registerComponent("UIDirectiveCodeBlock", CodeBlock);

export default CodeBlock;
