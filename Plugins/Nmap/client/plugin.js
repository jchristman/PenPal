import.meta.glob("./**/*.jsx", { eager: true });
import PenPal from "@penpal/core";

import NmapEnrichmentDisplay from "./components/nmap-enrichment-display.jsx";

const NmapPlugin = {
  loadPlugin() {
    // Register the Nmap enrichment display component with PenPal
    if (PenPal.API?.registerEnrichmentDisplay) {
      PenPal.API.registerEnrichmentDisplay("Nmap", NmapEnrichmentDisplay);
    } else {
      console.warn("Nmap: PenPal.API.registerEnrichmentDisplay not available");
    }

    return {};
  },
};

export default NmapPlugin;
