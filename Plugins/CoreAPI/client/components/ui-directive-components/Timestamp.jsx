import React from "react";
import { Typography, Tooltip } from "@mui/material";
import moment from "moment";
import { registerComponent } from "@penpal/core";

const Timestamp = ({ value, format = "relative" }) => {
  if (!value) {
    return null;
  }

  const m = moment(value);

  if (!m.isValid()) {
    return (
      <Typography variant="body2" color="textSecondary">
        {value}
      </Typography>
    );
  }

  const fullDate = m.format("YYYY-MM-DD HH:mm:ss");
  const relativeDate = m.fromNow();

  if (format === "relative") {
    return (
      <Tooltip title={fullDate}>
        <Typography
          variant="body2"
          color="textSecondary"
          style={{ cursor: "default" }}
        >
          {relativeDate}
        </Typography>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={relativeDate}>
      <Typography
        variant="body2"
        color="textSecondary"
        style={{ cursor: "default" }}
      >
        {fullDate}
      </Typography>
    </Tooltip>
  );
};

registerComponent("UIDirectiveTimestamp", Timestamp);

export default Timestamp;
