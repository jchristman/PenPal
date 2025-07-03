import React from "react";
import { Link, Box } from "@mui/material";
import { OpenInNew } from "@mui/icons-material";
import { registerComponent } from "@penpal/core";

const UrlLink = ({ href, label }) => {
  if (!href) {
    return null;
  }

  return (
    <Box display="flex" alignItems="center">
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        variant="body2"
      >
        {label || href}
      </Link>
      <OpenInNew fontSize="inherit" sx={{ ml: 0.5 }} />
    </Box>
  );
};

registerComponent("UIDirectiveUrlLink", UrlLink);

export default UrlLink;
