import React, { useState } from "react";
import { Components, registerComponent } from "@penpal/core";
import { ClipboardIcon, CheckIcon } from "@heroicons/react/24/outline";

const { Button, Tooltip } = Components;

interface CopyableTextProps {
  value: string;
  maxLength?: number;
  showCopyButton?: boolean;
  className?: string;
  truncate?: boolean;
  [key: string]: any;
}

const CopyableText: React.FC<CopyableTextProps> = ({
  value,
  maxLength = 200,
  showCopyButton = true,
  className = "",
  truncate = true,
  ...props
}) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCopy = async () => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  if (!value) return null;

  const text = String(value);
  const shouldTruncate = truncate && text.length > maxLength;
  const displayText =
    shouldTruncate && !isExpanded ? text.substring(0, maxLength) + "..." : text;

  return (
    <div className={`flex items-start gap-2 ${className}`} {...props}>
      <div className="flex-1 min-w-0">
        <span className="text-sm break-words">{displayText}</span>
        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
          >
            {isExpanded ? "Show less" : "Show more"}
          </button>
        )}
      </div>

      {showCopyButton && (
        <Tooltip content={copied ? "Copied!" : "Copy to clipboard"}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="flex-shrink-0 h-6 w-6 p-1"
          >
            {copied ? (
              <CheckIcon className="h-4 w-4 text-green-600" />
            ) : (
              <ClipboardIcon className="h-4 w-4" />
            )}
          </Button>
        </Tooltip>
      )}
    </div>
  );
};

registerComponent("UIDirectiveCopyableText", CopyableText);

export default CopyableText;
