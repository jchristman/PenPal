import React from "react";
import { Components, registerComponent } from "@penpal/core";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";

const { Tooltip } = Components;

const UrlLink = ({ value, label, className = "", ...props }) => {
  if (!value) return null;
  const display = label || value;
  return (
    <Tooltip content={value}>
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1 text-blue-600 hover:underline ${className}`}
        {...props}
      >
        {display}
        <ArrowTopRightOnSquareIcon className="ml-1 h-4 w-4 text-blue-400" />
      </a>
    </Tooltip>
  );
};

registerComponent("UIDirectiveUrlLink", UrlLink);

export default UrlLink;
