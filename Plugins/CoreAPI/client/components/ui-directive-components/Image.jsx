import React from "react";
import { registerComponent } from "@penpal/core";

const Image = ({ src, maxWidth = "400px", thumbnail = false }) => {
  if (!src) {
    return null;
  }

  // TODO: Add thumbnail/preview logic

  return (
    <div>
      <img
        src={src}
        style={{
          width: "100%",
          height: "auto",
          borderRadius: "4px",
          maxWidth: maxWidth,
          margin: "8px 0",
        }}
        alt="Enrichment Image"
      />
    </div>
  );
};

registerComponent("UIDirectiveImage", Image);

export default Image;
