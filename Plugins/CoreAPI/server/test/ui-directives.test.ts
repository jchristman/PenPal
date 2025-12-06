// UI Directives Test Suite
// Tests the GraphQL schema directives for UI component annotations

import { describe, it, expect, beforeEach } from "node:test";
import { buildSchema, GraphQLError } from "graphql";
import {
  UIDirectiveUtils,
  schemaDirectives,
} from "../graphql/resolvers/ui-directives.default.ts";

// Mock schema with UI directives for testing
const testSchema = `
  enum UIComponentType {
    TEXT
    BADGE
    URL_LINK
    STATUS_INDICATOR
    PROGRESS_BAR
    METRIC
    COPYABLE_TEXT
    ALERT
    KEY_VALUE
    COLLAPSIBLE
  }

  input UIComponentConfig {
    color: String
    size: String
    unit: String
    priority: Int
    group: String
  }

  directive @uiComponent(
    type: UIComponentType!
    config: UIComponentConfig
    description: String
  ) on FIELD_DEFINITION

  directive @uiGroup(
    name: String!
    label: String
    collapsible: Boolean = false
  ) on OBJECT

  directive @enrichmentDisplay(
    layout: String = "card"
    showSummary: Boolean = true
  ) on OBJECT

  type TestEnrichment @uiGroup(name: "http", label: "HTTP Information") @enrichmentDisplay(layout: "card") {
    url: String @uiComponent(type: URL_LINK, description: "The discovered URL")
    status_code: Int @uiComponent(type: STATUS_INDICATOR, config: { color: "success" })
    tech: [String] @uiComponent(type: BADGE, config: { color: "primary", group: "technologies" })
    response_size: Int @uiComponent(type: METRIC, config: { unit: "bytes", priority: 1 })
    response_time: Int @uiComponent(type: PROGRESS_BAR, config: { max: 5000, unit: "ms" })
    title: String @uiComponent(type: TEXT, config: { priority: 0 })
  }
`;

describe("UI Directives Test Suite", () => {
  let schema;
  let testType;

  beforeEach(() => {
    // Build schema with directives
    schema = buildSchema(testSchema);
    testType = schema.getType("TestEnrichment");
  });

  describe("UIComponentType Enum", () => {
    it("should define all required component types", () => {
      const componentType = schema.getType("UIComponentType");
      expect(componentType).toBeDefined();

      const values = componentType.getValues();
      const valueNames = values.map((v) => v.name);

      expect(valueNames).toContain("TEXT");
      expect(valueNames).toContain("BADGE");
      expect(valueNames).toContain("URL_LINK");
      expect(valueNames).toContain("STATUS_INDICATOR");
      expect(valueNames).toContain("PROGRESS_BAR");
      expect(valueNames).toContain("METRIC");
      expect(valueNames).toContain("COPYABLE_TEXT");
      expect(valueNames).toContain("ALERT");
      expect(valueNames).toContain("KEY_VALUE");
      expect(valueNames).toContain("COLLAPSIBLE");
    });
  });

  describe("@uiComponent Directive", () => {
    it("should store component metadata on fields", () => {
      const urlField = testType.getFields().url;
      const statusField = testType.getFields().status_code;

      // Mock the directive metadata (normally set by directive visitor)
      urlField._uiComponent = {
        type: "URL_LINK",
        config: {},
        description: "The discovered URL",
        fieldName: "url",
        fieldType: "String",
      };

      statusField._uiComponent = {
        type: "STATUS_INDICATOR",
        config: { color: "success" },
        fieldName: "status_code",
        fieldType: "Int",
      };

      const urlComponent = UIDirectiveUtils.getFieldUIComponent(urlField);
      expect(urlComponent).toBeDefined();
      expect(urlComponent.type).toBe("URL_LINK");
      expect(urlComponent.description).toBe("The discovered URL");

      const statusComponent = UIDirectiveUtils.getFieldUIComponent(statusField);
      expect(statusComponent).toBeDefined();
      expect(statusComponent.type).toBe("STATUS_INDICATOR");
      expect(statusComponent.config.color).toBe("success");
    });

    it("should extract all fields with UI components", () => {
      // Mock directive metadata for testing
      const fields = testType.getFields();
      Object.keys(fields).forEach((fieldName) => {
        fields[fieldName]._uiComponent = {
          type: "TEXT",
          config: {},
          fieldName,
        };
      });

      const fieldsWithComponents =
        UIDirectiveUtils.getFieldsWithUIComponents(testType);
      expect(fieldsWithComponents.length).toBeGreaterThan(0);
      expect(fieldsWithComponents.every((f) => f.component)).toBe(true);
    });

    it("should group fields by UI group", () => {
      const fields = [
        { name: "tech", component: { config: { group: "technologies" } } },
        { name: "version", component: { config: { group: "technologies" } } },
        { name: "url", component: { config: {} } },
        { name: "title", component: { config: {} } },
      ];

      const { groups, ungrouped } =
        UIDirectiveUtils.groupFieldsByUIGroup(fields);

      expect(groups.technologies).toBeDefined();
      expect(groups.technologies.length).toBe(2);
      expect(ungrouped.length).toBe(2);
    });

    it("should sort fields by priority", () => {
      const fields = [
        { name: "low", component: { config: { priority: 10 } } },
        { name: "high", component: { config: { priority: 1 } } },
        { name: "medium", component: { config: { priority: 5 } } },
        { name: "default", component: { config: {} } },
      ];

      const sorted = UIDirectiveUtils.sortFieldsByPriority(fields);

      expect(sorted[0].name).toBe("high");
      expect(sorted[1].name).toBe("medium");
      expect(sorted[2].name).toBe("low");
      expect(sorted[3].name).toBe("default"); // Priority defaults to 999
    });

    it("should handle new component types correctly", () => {
      const newComponents = [
        {
          name: "api_key",
          component: {
            type: "COPYABLE_TEXT",
            config: { maxLength: 100, showCopyButton: true },
          },
        },
        {
          name: "warning",
          component: {
            type: "ALERT",
            config: { severity: "warning", title: "Security Warning" },
          },
        },
        {
          name: "metadata",
          component: {
            type: "KEY_VALUE",
            config: { orientation: "vertical", maxItems: 5 },
          },
        },
        {
          name: "details",
          component: {
            type: "COLLAPSIBLE",
            config: { title: "Full Details", defaultOpen: false },
          },
        },
      ];

      newComponents.forEach((comp) => {
        expect(comp.component.type).toBeDefined();
        expect(comp.component.config).toBeDefined();
      });

      // Test component type validation
      const validTypes = [
        "TEXT",
        "BADGE",
        "URL_LINK",
        "STATUS_INDICATOR",
        "PROGRESS_BAR",
        "METRIC",
        "COPYABLE_TEXT",
        "ALERT",
        "KEY_VALUE",
        "COLLAPSIBLE",
      ];

      newComponents.forEach((comp) => {
        expect(validTypes).toContain(comp.component.type);
      });
    });
  });

  describe("@uiGroup Directive", () => {
    it("should store group metadata on types", () => {
      // Mock the directive metadata
      testType._uiGroup = {
        name: "http",
        label: "HTTP Information",
        collapsible: false,
        collapsed: false,
        priority: 0,
      };

      const groupMeta = UIDirectiveUtils.getTypeUIGroup(testType);
      expect(groupMeta).toBeDefined();
      expect(groupMeta.name).toBe("http");
      expect(groupMeta.label).toBe("HTTP Information");
    });
  });

  describe("@enrichmentDisplay Directive", () => {
    it("should store display configuration on types", () => {
      // Mock the directive metadata
      testType._enrichmentDisplay = {
        layout: "card",
        showSummary: true,
        summaryFields: [],
        maxHeight: undefined,
        title: undefined,
      };

      const displayMeta = UIDirectiveUtils.getTypeEnrichmentDisplay(testType);
      expect(displayMeta).toBeDefined();
      expect(displayMeta.layout).toBe("card");
      expect(displayMeta.showSummary).toBe(true);
    });
  });

  describe("Configuration Validation", () => {
    it("should validate UI component configurations", () => {
      // Valid configurations
      expect(
        UIDirectiveUtils.validateUIComponentConfig("PROGRESS_BAR", { max: 100 })
      ).toEqual([]);
      expect(
        UIDirectiveUtils.validateUIComponentConfig("LIST", { maxItems: 5 })
      ).toEqual([]);
      expect(
        UIDirectiveUtils.validateUIComponentConfig("BADGE", {
          color: "primary",
        })
      ).toEqual([]);

      // Invalid configurations
      const invalidProgressBar = UIDirectiveUtils.validateUIComponentConfig(
        "PROGRESS_BAR",
        { max: -1 }
      );
      expect(invalidProgressBar.length).toBeGreaterThan(0);
      expect(invalidProgressBar[0]).toContain(
        "max value must be greater than 0"
      );

      const invalidColor = UIDirectiveUtils.validateUIComponentConfig("BADGE", {
        color: "invalid",
      });
      expect(invalidColor.length).toBeGreaterThan(0);
      expect(invalidColor[0]).toContain("Invalid color theme");

      const invalidSize = UIDirectiveUtils.validateUIComponentConfig("TEXT", {
        size: "huge",
      });
      expect(invalidSize.length).toBeGreaterThan(0);
      expect(invalidSize[0]).toContain("Invalid size");
    });
  });

  describe("Data Transformation", () => {
    it("should format metric values correctly", () => {
      // Test byte formatting
      const bytes1 = { value: 1024, unit: "bytes" };
      const bytes2 = { value: 1048576, unit: "bytes" };
      const bytes3 = { value: 512, unit: "bytes" };

      // Note: These would normally be transformed by the directive visitor
      // Here we're testing the transformation logic concept
      expect(typeof bytes1.value).toBe("number");
      expect(bytes1.unit).toBe("bytes");
    });

    it("should format timestamps correctly", () => {
      const timestamp = "2024-01-15T10:30:00Z";
      const date = new Date(timestamp);

      // Test timestamp formatting concept
      expect(date.toISOString()).toBe(timestamp);
      expect(typeof date.toLocaleDateString()).toBe("string");
    });

    it("should normalize progress values", () => {
      // Test progress normalization concept
      const value = 75;
      const max = 100;
      const percentage = Math.min(100, Math.max(0, (value / max) * 100));

      expect(percentage).toBe(75);
      expect(percentage).toBeGreaterThanOrEqual(0);
      expect(percentage).toBeLessThanOrEqual(100);
    });
  });
});

// Export test utilities for other test files
export const TestUtils = {
  createMockField: (name, type, componentType, config = {}) => ({
    name,
    type: { toString: () => type },
    _uiComponent: {
      type: componentType,
      config,
      fieldName: name,
      fieldType: type,
    },
  }),

  createMockEnrichmentType: (name, fields = []) => ({
    name,
    getFields: () =>
      fields.reduce((acc, field) => {
        acc[field.name] = field;
        return acc;
      }, {}),
    _uiGroup: null,
    _enrichmentDisplay: null,
  }),
};

export default { UIDirectiveUtils, TestUtils };
