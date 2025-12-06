// UI Directives Utility Functions
// Provides utilities for working with UI component directives in enrichment schemas

/**
 * Data transformation utilities for UI components
 */
export const UIDataTransformers = {
  /**
   * Format metric values with appropriate units
   */
  formatMetric(value, unit, format) {
    if (value === null || value === undefined) return null;

    if (unit === "bytes") {
      return this.formatBytes(value);
    }
    if (unit === "duration") {
      return this.formatDuration(value);
    }
    return { value, unit, formatted: `${value} ${unit || ""}`.trim() };
  },

  /**
   * Format bytes into human-readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return { value: 0, unit: "B", formatted: "0 B" };
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
    return { value, unit: sizes[i], formatted: `${value} ${sizes[i]}` };
  },

  /**
   * Format duration in milliseconds
   */
  formatDuration(ms) {
    if (ms < 1000) return { value: ms, unit: "ms", formatted: `${ms} ms` };
    if (ms < 60000)
      return {
        value: (ms / 1000).toFixed(1),
        unit: "s",
        formatted: `${(ms / 1000).toFixed(1)} s`,
      };
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return {
      value: ms,
      unit: "min",
      formatted: `${minutes}:${seconds.padStart(2, "0")}`,
    };
  },

  /**
   * Format timestamp with various formats
   */
  formatTimestamp(value, format) {
    if (value === null || value === undefined) return null;

    const date = new Date(value);
    return {
      value,
      formatted: date.toLocaleDateString(),
      iso: date.toISOString(),
      relative: this.getRelativeTime(date),
    };
  },

  /**
   * Get relative time string
   */
  getRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) return "just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  },

  /**
   * Normalize progress values for progress bars
   */
  normalizeProgress(value, config = {}) {
    if (value === null || value === undefined) return null;

    const max = config.max || 100;
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    return { value, max, percentage: Math.round(percentage) };
  },
};

/**
 * Utility functions for working with UI directive annotations (future implementation)
 */
export const UIDirectiveUtils = {
  /**
   * Extract UI component metadata from a GraphQL field
   */
  getFieldUIComponent(field) {
    return field._uiComponent || null;
  },

  /**
   * Extract UI group metadata from a GraphQL type
   */
  getTypeUIGroup(type) {
    return type._uiGroup || null;
  },

  /**
   * Extract enrichment display metadata from a GraphQL type
   */
  getTypeEnrichmentDisplay(type) {
    return type._enrichmentDisplay || null;
  },

  /**
   * Get all fields with UI components from a type
   */
  getFieldsWithUIComponents(type) {
    const fields = type.getFields ? type.getFields() : {};
    return Object.values(fields)
      .filter((field) => field._uiComponent)
      .map((field) => ({
        name: field.name,
        component: field._uiComponent,
        type: field.type.toString(),
      }));
  },

  /**
   * Group fields by their UI group configuration
   */
  groupFieldsByUIGroup(fields) {
    const groups = {};
    const ungrouped = [];

    fields.forEach((field) => {
      const groupName = field.component?.config?.group;
      if (groupName) {
        if (!groups[groupName]) {
          groups[groupName] = [];
        }
        groups[groupName].push(field);
      } else {
        ungrouped.push(field);
      }
    });

    return { groups, ungrouped };
  },

  /**
   * Sort fields by priority
   */
  sortFieldsByPriority(fields) {
    return fields.sort((a, b) => {
      const priorityA = a.component?.config?.priority || 999;
      const priorityB = b.component?.config?.priority || 999;
      return priorityA - priorityB;
    });
  },

  /**
   * Validate UI component configuration
   */
  validateUIComponentConfig(componentType, config) {
    const errors = [];

    if (componentType === "PROGRESS_BAR" && config.max && config.max <= 0) {
      errors.push("PROGRESS_BAR max value must be greater than 0");
    }

    if (componentType === "LIST" && config.maxItems && config.maxItems <= 0) {
      errors.push("LIST maxItems must be greater than 0");
    }

    if (
      config.color &&
      !["primary", "secondary", "success", "warning", "error", "info"].includes(
        config.color
      )
    ) {
      errors.push(`Invalid color theme: ${config.color}`);
    }

    if (config.size && !["small", "medium", "large"].includes(config.size)) {
      errors.push(`Invalid size: ${config.size}`);
    }

    return errors;
  },
};

// Default export for resolver registration - following CoreAPI pattern
export default {};
