import.meta.glob("./**/*.jsx", { eager: true });
import PenPal from "@penpal/core";

import HttpXEnrichmentDisplay from "./components/httpx-enrichment-display.jsx";

const HttpXPlugin = {
  loadPlugin() {
    // Register the HttpX enrichment display component with PenPal
    // Use a retry mechanism to handle plugin loading order issues
    const registerHttpXDisplay = () => {
      if (PenPal.API?.registerEnrichmentDisplay) {
        PenPal.API.registerEnrichmentDisplay("HttpX", HttpXEnrichmentDisplay);
        console.log(
          "HttpX: Successfully registered enrichment display component"
        );
        return true;
      } else {
        console.log(
          "HttpX: PenPal.API.registerEnrichmentDisplay not yet available, retrying..."
        );
        return false;
      }
    };

    // Try immediate registration
    if (!registerHttpXDisplay()) {
      // If not available, retry with intervals
      let retryCount = 0;
      const maxRetries = 20; // Try for 10 seconds (500ms * 20)

      const retryInterval = setInterval(() => {
        retryCount++;

        if (registerHttpXDisplay()) {
          clearInterval(retryInterval);
        } else if (retryCount >= maxRetries) {
          console.warn(
            "HttpX: Failed to register enrichment display after maximum retries"
          );
          clearInterval(retryInterval);
        }
      }, 500);
    }

    return {};
  },
};

export default HttpXPlugin;
