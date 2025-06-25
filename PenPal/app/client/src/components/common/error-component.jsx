import React from "react";
import { Components, registerComponent } from "@penpal/core";

const ErrorDisplay = ({ err_number, message, stack }) => {
  return (
    <div className="absolute inset-0 bg-gray-200 flex flex-col items-center justify-center">
      <Components.Card className="max-w-1/2 max-h-1/2 p-5 shadow-lg">
        <div className="flex items-center mb-4">
          <span className="text-2xl text-red-500 mr-2">🚫</span>
          <h3 className="text-lg font-semibold text-gray-800">
            Error #{err_number}
          </h3>
        </div>

        <p className="text-gray-700 mb-4">
          An error has occurred. Please inform the dev team of this error and
          any steps you took to trigger it.
        </p>

        <div className="overflow-auto max-h-64">
          <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap break-words">
            {message}
          </pre>
          <pre className="text-sm font-mono text-gray-600 whitespace-pre-wrap break-words mt-2">
            {stack}
          </pre>
        </div>
      </Components.Card>
    </div>
  );
};

registerComponent("ErrorDisplay", ErrorDisplay);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ErrorDisplay;
