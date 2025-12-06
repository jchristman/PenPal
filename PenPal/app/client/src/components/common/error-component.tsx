import React, { useState } from "react";
import { Components, registerComponent } from "@penpal/core";
import CodeHighlight from "./code-highlight.tsx";

interface ErrorDisplayProps {
  err_number?: number | null;
  message?: string;
  stack?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ err_number, message, stack }) => {
  const [copied, setCopied] = useState(false);

  console.log("ErrorDisplay", { err_number, message, stack });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(stack || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      setCopied(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-gray-200 flex flex-col items-center justify-center z-50">
      <Components.Card className="w-full max-w-5xl p-12 shadow-2xl border border-red-200">
        <div className="flex items-center mb-6 gap-4">
          <span className="text-4xl text-red-500">🚫</span>
          <h3 className="text-3xl font-bold text-gray-900 tracking-tight">
            Application Error
          </h3>
          {err_number !== undefined && err_number !== null && (
            <span className="ml-2 px-2 py-1 rounded bg-red-100 text-red-700 text-sm font-mono border border-red-200">
              #{err_number}
            </span>
          )}
        </div>

        <Components.Alert variant="destructive" className="mb-8">
          <Components.AlertTitle>Something went wrong</Components.AlertTitle>
          <Components.AlertDescription>
            {message ||
              "An unexpected error occurred. Please inform the dev team and describe any steps you took to trigger this error."}
          </Components.AlertDescription>
        </Components.Alert>

        <div className="mb-3 flex items-center justify-between">
          <span className="font-semibold text-gray-700 text-lg">
            Stack Trace
          </span>
          <button
            onClick={handleCopy}
            className={`px-4 py-2 rounded text-sm font-mono border transition-colors duration-150 ${
              copied
                ? "bg-green-100 border-green-300 text-green-700"
                : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
            }`}
            aria-label="Copy stack trace"
          >
            {copied ? "Copied!" : "Copy Stack Trace"}
          </button>
        </div>
        <div className="overflow-auto rounded-lg border border-gray-200 bg-gray-900 max-h-[60vh] min-h-60 mb-2 p-2">
          <div className="text-base">
            <CodeHighlight
              code={stack || "No stack trace available."}
              language="js"
            />
          </div>
        </div>
      </Components.Card>
    </div>
  );
};

registerComponent("ErrorDisplay", ErrorDisplay);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ErrorDisplay;
