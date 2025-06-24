import PenPal from "@penpal/core";
import GowitnessEnrichmentDisplay from "./components/gowitness-enrichment-display.jsx";

const GowitnessPlugin = {
  loadPlugin() {
    PenPal.API.registerEnrichmentDisplay(
      "Gowitness",
      GowitnessEnrichmentDisplay
    );
    console.log("Gowitness enrichment display component registered");

    return {};
  },
};

export default GowitnessPlugin;
