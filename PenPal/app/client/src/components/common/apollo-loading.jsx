import React from "react";
import { Components, registerComponent } from "@penpal/core";

const ApolloLoading = ({
  status,
  error,
  onRetry,
  progress = 0,
  maxRetries = 10,
  currentRetry = 0,
}) => {
  if (error) {
    const hasExhaustedRetries = currentRetry >= maxRetries;

    return (
      <div className="fixed inset-0 bg-white/95 flex flex-col items-center justify-center z-50">
        <Components.Card className="max-w-lg p-8 text-center shadow-lg bg-red-50 border-red-200">
          <div className="flex items-center justify-center gap-2 mb-4 text-red-600">
            <span className="text-2xl">⚠️</span>
            <h2 className="text-xl font-semibold">
              {hasExhaustedRetries ? "Connection Timeout" : "Connection Failed"}
            </h2>
          </div>

          <p className="text-gray-700 mb-4">
            {hasExhaustedRetries
              ? "Unable to establish connection after multiple attempts. Please check that the PenPal server is running."
              : "Unable to connect to the PenPal server. This usually happens when:"}
          </p>

          {!hasExhaustedRetries && (
            <ul className="text-left text-sm text-gray-600 mb-4 space-y-1">
              <li>• The server is still starting up</li>
              <li>• There are network connectivity issues</li>
              <li>• The GraphQL server is not running</li>
            </ul>
          )}

          {currentRetry > 0 && (
            <p className="text-sm text-gray-500 mb-4">
              Retry attempt {currentRetry} of {maxRetries}
            </p>
          )}

          <div className="mb-6 p-4 bg-red-25 border border-red-200 rounded text-left text-sm font-mono text-gray-700 max-h-48 overflow-auto">
            {error.message}
          </div>

          <Components.Button
            variant={hasExhaustedRetries ? "secondary" : "default"}
            onClick={onRetry}
            disabled={hasExhaustedRetries}
            className="w-full"
          >
            <span className="mr-2">🔄</span>
            {hasExhaustedRetries ? "Max Retries Reached" : "Retry Connection"}
          </Components.Button>

          {hasExhaustedRetries && (
            <p className="text-xs text-gray-500 mt-4">
              Try refreshing the page or contact support if the problem
              persists.
            </p>
          )}
        </Components.Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white/95 flex flex-col items-center justify-center z-50">
      <Components.Card className="max-w-md p-8 text-center shadow-lg">
        <div className="text-5xl font-bold text-blue-600 mb-6 font-sans">
          PenPal
        </div>

        <div className="mb-6">
          <Components.Spinner className="w-15 h-15" />
        </div>

        <div className="mb-4">
          <Components.Progress value={progress} className="h-2" />
        </div>

        <p className="text-gray-600 min-h-6 mb-2">
          {status || "Initializing..."}
        </p>

        {currentRetry > 0 && (
          <p className="text-sm text-gray-500">
            Retry attempt {currentRetry} of {maxRetries}
          </p>
        )}
      </Components.Card>
    </div>
  );
};

registerComponent("ApolloLoading", ApolloLoading);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ApolloLoading;
