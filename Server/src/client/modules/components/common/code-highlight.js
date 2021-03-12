import React, { useEffect } from "react";
import { registerComponent, Components } from "meteor/penpal";
import "clipboard"; // Load before prism so prism can use it
import "./prism.js"; // Loads as a global
import "./prism.css";

Prism.plugins.NormalizeWhitespace.setDefaults({
  "remove-trailing": true,
  "remove-indent": true,
  "left-trim": true,
  "right-trim": true,
  "tabs-to-spaces": 4
});

const CodeHighlight = ({ code: _code, language = "" }) => {
  useEffect(() => Prism.highlightAll());

  return (
    // We need a wrapping div because the Prism code adds a sibling node
    <div>
      <pre>
        <code
          style={{ whiteSpace: "pre-wrap" }}
          className={`language-${language.toLowerCase()}`}
        >
          {_code}
        </code>
      </pre>
    </div>
  );
};

registerComponent("CodeHighlight", CodeHighlight);
