import.meta.glob("./**/*.jsx", { eager: true });
import PenPal from "@penpal/core";

import HttpXEnrichmentDisplay from "./components/httpx-enrichment-display.jsx";

const HttpXPlugin = {
  loadPlugin() {
    // Register the HttpX enrichment display component with PenPal
    if (PenPal.API?.registerEnrichmentDisplay) {
      PenPal.API.registerEnrichmentDisplay("HttpX", HttpXEnrichmentDisplay);
    } else {
      console.warn("HttpX: PenPal.API.registerEnrichmentDisplay not available");
    }

    return {};
  },
};

export default HttpXPlugin;
