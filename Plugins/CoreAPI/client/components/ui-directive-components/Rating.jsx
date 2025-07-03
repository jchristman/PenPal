import React from "react";
import { Rating as MuiRating } from "@mui/material";
import { registerComponent } from "@penpal/core";

const Rating = ({ value, max = 5, style = "stars" }) => {
  if (value === undefined || value === null) {
    return null;
  }

  if (style === "stars") {
    return (
      <MuiRating
        name="read-only"
        value={value}
        max={max}
        precision={0.5}
        readOnly
      />
    );
  }

  return <p className="text-sm text-muted-foreground">{`${value} / ${max}`}</p>;
};

registerComponent("UIDirectiveRating", Rating);

export default Rating;
