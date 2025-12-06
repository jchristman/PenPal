// @ts-nocheck
import.meta.glob("./**/*.tsx", { eager: true });
import PenPal from "@penpal/core";

import NmapEnrichmentDisplay from "./components/nmap-enrichment-display.tsx";

const NmapPlugin = {
  loadPlugin() {
    // The custom NmapEnrichmentDisplay is now disabled.
    // The new generic UI system will be used instead, based on the
    // @uiComponent directives in the GraphQL schema.
    return {};
  },
};

export default NmapPlugin;
