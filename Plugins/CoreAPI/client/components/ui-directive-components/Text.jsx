import React from "react";
import { registerComponent } from "@penpal/core";

const Text = ({ value, maxLength }) => {
  if (value === undefined || value === null) {
    return null;
  }

  const text = String(value);

  if (maxLength && text.length > maxLength) {
    return (
      <p className="text-sm text-muted-foreground" title={text}>
        {`${text.substring(0, maxLength)}...`}
      </p>
    );
  }

  return <p className="text-sm text-muted-foreground">{text}</p>;
};

registerComponent("UIDirectiveText", Text);

export default Text;
