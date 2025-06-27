import.meta.glob("./**/*.jsx", { eager: true });
import PenPal from "@penpal/core";

import NmapEnrichmentDisplay from "./components/nmap-enrichment-display.jsx";

const NmapPlugin = {
  loadPlugin() {
    // Register the Nmap enrichment display component with PenPal
    // Use a retry mechanism to handle plugin loading order issues
    const registerNmapDisplay = () => {
      if (PenPal.API?.registerEnrichmentDisplay) {
        PenPal.API.registerEnrichmentDisplay("Nmap", NmapEnrichmentDisplay);
        console.log(
          "Nmap: Successfully registered enrichment display component"
        );
        return true;
      } else {
        console.log(
          "Nmap: PenPal.API.registerEnrichmentDisplay not yet available, retrying..."
        );
        return false;
      }
    };

    // Try immediate registration
    if (!registerNmapDisplay()) {
      // If not available, retry with intervals
      let retryCount = 0;
      const maxRetries = 20; // Try for 10 seconds (500ms * 20)

      const retryInterval = setInterval(() => {
        retryCount++;

        if (registerNmapDisplay()) {
          clearInterval(retryInterval);
        } else if (retryCount >= maxRetries) {
          console.warn(
            "Nmap: Failed to register enrichment display after maximum retries"
          );
          clearInterval(retryInterval);
        }
      }, 500);
    }

    return {};
  },
};

export default NmapPlugin;
