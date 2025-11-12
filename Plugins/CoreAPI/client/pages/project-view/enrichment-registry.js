/**
 * Enrichment Registry API
 * 
 * Provides a modular system for plugins to register enrichment display capabilities
 * and custom renderers without requiring CoreAPI to know about specific plugins.
 */

import PenPal from "@penpal/core";

// Initialize registries on PenPal.API
if (!PenPal.API) {
  PenPal.API = {};
}

// Registry for enrichment display components (table view)
if (!PenPal.API.EnrichmentDisplayRegistry) {
  PenPal.API.EnrichmentDisplayRegistry = new Map();
}

// Registry for enrichment capabilities (e.g., card view support)
if (!PenPal.API.EnrichmentCapabilitiesRegistry) {
  PenPal.API.EnrichmentCapabilitiesRegistry = new Map();
}

// Registry for custom card view renderers
if (!PenPal.API.EnrichmentCardRendererRegistry) {
  PenPal.API.EnrichmentCardRendererRegistry = new Map();
}

/**
 * Register an enrichment display component for table view
 * @param {string} pluginName - The plugin name (must match plugin_name in enrichment data)
 * @param {React.Component} component - React component that receives { enrichment } as props
 */
export const registerEnrichmentDisplay = (pluginName, component) => {
  PenPal.API.EnrichmentDisplayRegistry.set(pluginName, component);
};

/**
 * Register enrichment capabilities
 * @param {string} pluginName - The plugin name
 * @param {Object} capabilities - Capabilities object with properties like:
 *   - supportsCardView: boolean - Whether this plugin supports card view
 *   - cardViewLabel: string (optional) - Custom label for card view toggle
 */
export const registerEnrichmentCapabilities = (pluginName, capabilities) => {
  PenPal.API.EnrichmentCapabilitiesRegistry.set(pluginName, {
    pluginName,
    ...capabilities,
  });
};

/**
 * Register a custom card view renderer component
 * @param {string} pluginName - The plugin name
 * @param {React.Component} component - React component that receives { service, enrichment } as props
 */
export const registerEnrichmentCardRenderer = (pluginName, component) => {
  PenPal.API.EnrichmentCardRendererRegistry.set(pluginName, component);
};

/**
 * Check if a plugin supports card view
 * @param {string} pluginName - The plugin name
 * @returns {boolean}
 */
export const supportsCardView = (pluginName) => {
  const capabilities = PenPal.API.EnrichmentCapabilitiesRegistry.get(pluginName);
  return capabilities?.supportsCardView === true;
};

/**
 * Get the card view renderer for a plugin, or null if not registered
 * @param {string} pluginName - The plugin name
 * @returns {React.Component|null}
 */
export const getCardRenderer = (pluginName) => {
  return PenPal.API.EnrichmentCardRendererRegistry.get(pluginName) || null;
};

/**
 * Get enrichment display component for a plugin, or null if not registered
 * @param {string} pluginName - The plugin name
 * @returns {React.Component|null}
 */
export const getEnrichmentDisplay = (pluginName) => {
  return PenPal.API.EnrichmentDisplayRegistry.get(pluginName) || null;
};

// Expose registration functions on PenPal.API for plugins to use
PenPal.API.registerEnrichmentDisplay = registerEnrichmentDisplay;
PenPal.API.registerEnrichmentCapabilities = registerEnrichmentCapabilities;
PenPal.API.registerEnrichmentCardRenderer = registerEnrichmentCardRenderer;

// Export utility functions
export default {
  registerEnrichmentDisplay,
  registerEnrichmentCapabilities,
  registerEnrichmentCardRenderer,
  supportsCardView,
  getCardRenderer,
  getEnrichmentDisplay,
};

