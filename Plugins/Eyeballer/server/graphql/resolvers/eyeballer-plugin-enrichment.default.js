import PenPal from "#penpal/core";

// Import the shared logger from plugin.js
import { EyeballerLogger as logger } from "../../plugin.js";

const isEyeballerPluginEnrichment = (obj) => {
  if (obj.plugin_name === "Eyeballer") {
    return "EyeballerPluginEnrichment";
  }
  return null;
};

// Register this resolver with the interface resolver system
PenPal.Utils.RunAfterImport(() => {
  // Ensure PenPal.API exists before accessing it
  if (!PenPal.API) {
    logger.warn(
      "PenPal.API not available, skipping interface resolver registration"
    );
    return;
  }

  if (!PenPal.API.InterfaceResolvers) {
    logger.warn(
      "PenPal.API.InterfaceResolvers not available, skipping registration"
    );
    return;
  }

  if (!PenPal.API.InterfaceResolvers.PluginEnrichments) {
    PenPal.API.InterfaceResolvers.PluginEnrichments = [];
  }
  PenPal.API.InterfaceResolvers.PluginEnrichments.push(
    isEyeballerPluginEnrichment
  );
});

export default {
  EyeballerPluginEnrichment: {
    old_looking(obj) {
      return obj.old_looking || obj.data?.old_looking || false;
    },
    login_page(obj) {
      return obj.login_page || obj.data?.login_page || false;
    },
    webapp(obj) {
      return obj.webapp || obj.data?.webapp || false;
    },
    custom_404(obj) {
      return obj.custom_404 || obj.data?.custom_404 || false;
    },
    parked_domain(obj) {
      return obj.parked_domain || obj.data?.parked_domain || false;
    },
    confidence_scores(obj) {
      return obj.confidence_scores || obj.data?.confidence_scores || {};
    },
    confidence_scores_table(obj) {
      // Transform confidence_scores object into table format
      const scores = obj.confidence_scores || obj.data?.confidence_scores || {};
      
      // Map field names to display labels
      const fieldLabels = {
        custom_404: "Custom 404",
        login_page: "Login Page",
        webapp: "Webapp",
        old_looking: "Old-Looking Site",
        parked_domain: "Parked Domain",
      };
      
      // Convert object to array of table rows
      return Object.entries(scores)
        .map(([key, value]) => {
          const numValue = typeof value === "number" ? value : parseFloat(value) || 0;
          return {
            Category: fieldLabels[key] || key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
            Confidence: `${(numValue * 100).toFixed(2)}%`,
            Value: numValue, // Keep raw value for sorting
          };
        })
        .sort((a, b) => b.Value - a.Value); // Sort by confidence descending
    },
    classified_at(obj) {
      return obj.classified_at || obj.data?.classified_at;
    },
    screenshot_bucket(obj) {
      return obj.screenshot_bucket || obj.data?.screenshot_bucket;
    },
    screenshot_key(obj) {
      return obj.screenshot_key || obj.data?.screenshot_key;
    },
    // Remove files resolver - handled by PluginEnrichment interface resolver
    data(obj) {
      // Return all properties except plugin_name and files as the data object
      const { plugin_name, files, ...data } = obj;
      return data;
    },
  },
};

