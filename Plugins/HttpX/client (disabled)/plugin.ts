// @ts-nocheck
import.meta.glob("./**/*.tsx", { eager: true });
import PenPal from "@penpal/core";

import HttpXEnrichmentDisplay from "./components/httpx-enrichment-display.tsx";

const HttpXPlugin = {
  loadPlugin() {
    // The custom HttpXEnrichmentDisplay is now disabled.
    // The new generic UI system will be used instead, based on the
    // @uiComponent directives in the GraphQL schema.
    return {};
  },
};

export default HttpXPlugin;
