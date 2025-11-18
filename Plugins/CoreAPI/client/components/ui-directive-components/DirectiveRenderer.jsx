import React from "react";
import { useQuery } from "@apollo/client";
import { Components, registerComponent } from "@penpal/core";
import GET_UI_DIRECTIVES from "./queries/get-ui-directives";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
// Import ScreenshotImage to ensure it's loaded and registered
import "./ScreenshotImage.jsx";

const { Spinner, Collapsible, CollapsibleTrigger, CollapsibleContent } =
  Components;

const DefaultFieldRenderer = ({ fieldName, fieldData }) => (
  <div className="flex justify-between mb-1">
    <p className="text-sm capitalize text-muted-foreground">
      {fieldName.replace(/_/g, " ")}:
    </p>
    <p className="text-sm text-muted-foreground">
      {Array.isArray(fieldData) ? fieldData.join(", ") : String(fieldData)}
    </p>
  </div>
);

const renderField = (fieldName, fieldData, fieldConfig) => {
  // Skip null/undefined fields
  if (fieldData == null) return null;

  // For boolean badges, only render when value is true
  if (
    fieldConfig?.uiComponent?.type === "BADGE" &&
    typeof fieldData === "boolean" &&
    !fieldData
  ) {
    return null;
  }

  // Define the mapping here so it always uses the latest Components
  const componentMap = {
    TEXT: Components.UIDirectiveText,
    BADGE: Components.UIDirectiveBadge,
    URL_LINK: Components.UIDirectiveUrlLink,
    STATUS_INDICATOR: Components.UIDirectiveStatusIndicator,
    PROGRESS_BAR: Components.UIDirectiveProgressBar,
    RATING: Components.UIDirectiveRating,
    METRIC: Components.UIDirectiveMetric,
    TIMESTAMP: Components.UIDirectiveTimestamp,
    LIST: Components.UIDirectiveList,
    TABLE: Components.UIDirectiveTable,
    JSON_TREE: Components.UIDirectiveJsonTree,
    CODE_BLOCK: Components.UIDirectiveCodeBlock,
    IMAGE: Components.UIDirectiveImage,
    COPYABLE_TEXT: Components.UIDirectiveCopyableText,
    ALERT: Components.UIDirectiveAlert,
    KEY_VALUE: Components.UIDirectiveKeyValue,
    COLLAPSIBLE: Components.UIDirectiveCollapsible,
  };

  if (!fieldConfig?.uiComponent) {
    return (
      <DefaultFieldRenderer
        key={fieldName}
        fieldName={fieldName}
        fieldData={fieldData}
      />
    );
  }

  const { type, config } = fieldConfig.uiComponent;
  const Component = componentMap[type];

  // DEBUG: Log the component for status_code
  if (process.env.NODE_ENV !== "production" && fieldName === "status_code") {
    console.log(
      `[renderField] status_code Component:`,
      Component,
      `type:`,
      typeof Component
    );
  }

  if (!Component) {
    console.warn(`No component mapping found for type: ${type}`);
    return (
      <DefaultFieldRenderer
        key={fieldName}
        fieldName={fieldName}
        fieldData={fieldData}
      />
    );
  }

  // Special handling for IMAGE fields that need screenshot_url computed
  // Check if this is screenshot_url field that's missing but we have bucket/key
  if (type === "IMAGE" && !fieldData && fieldName === "screenshot_url") {
    // Check if we have bucket/key in the enrichment data (passed via closure)
    // We need access to the full data object, so we'll handle this in DirectiveRenderer
    // For now, return null and let DirectiveRenderer handle it
  }

  const props = {
    ...config,
    value: fieldData,
    items: Array.isArray(fieldData) ? fieldData : undefined,
    href: type === "URL_LINK" ? fieldData : undefined,
    src: type === "IMAGE" ? fieldData : undefined,
  };

  const label = config?.label || fieldName.replace(/_/g, " ");

  return (
    <div key={fieldName} className="mb-1">
      {!config?.hideLabel && (
        <p className="text-xs capitalize text-muted-foreground">{label}</p>
      )}
      <Component {...props} />
    </div>
  );
};

const DirectiveRenderer = ({ enrichment }) => {
  const { __typename, ...data } = enrichment;

  const {
    loading,
    error,
    data: directiveData,
  } = useQuery(GET_UI_DIRECTIVES, {
    variables: { typeName: __typename },
  });

  if (loading) return <Spinner size="sm" />;
  if (error)
    return (
      <p className="text-red-500">
        Error loading UI directives: {error.message}
      </p>
    );

  const uiConfig = directiveData?.getUIDirectives;

  // Normalize uiGroup to always be an array
  let uiGroups = uiConfig.typeDirectives?.uiGroup;
  if (uiGroups && !Array.isArray(uiGroups)) {
    uiGroups = [uiGroups];
  }

  // DEBUG: Log UI Directives and field names
  if (process.env.NODE_ENV !== "production") {
    // console.log("UI Directives for", __typename, uiConfig);
    // console.log("Enrichment fields:", Object.keys(data));
  }

  // DEBUG: Log UI Directives fields and status_code value
  if (process.env.NODE_ENV !== "production") {
    console.log("[DirectiveRenderer] uiConfig.fields:", uiConfig.fields);
    console.log("[DirectiveRenderer] status_code value:", data.status_code);
    if (Object.keys(data).includes("status_code")) {
      console.log(
        "[DirectiveRenderer] status_code is present in data and will be considered for rendering."
      );
    } else {
      console.log("[DirectiveRenderer] status_code is NOT present in data.");
    }
  }

  if (!uiConfig || !uiConfig.fields) {
    return (
      <div>
        {Object.entries(data).map(([fieldName, fieldData]) => (
          <DefaultFieldRenderer
            key={fieldName}
            fieldName={fieldName}
            fieldData={fieldData}
          />
        ))}
      </div>
    );
  }

  // When rendering fields, skip the 'data' field
  // Also skip 'confidence_scores' if 'confidence_scores_table' exists (table version preferred)
  // Include fields from UI config even if not in data (for computed fields like screenshot_url)
  const allFields = new Set([
    ...Object.keys(data),
    ...Object.keys(uiConfig.fields || {}),
  ]);
  
  const fieldsByGroup = Array.from(allFields)
    .filter((fieldName) => {
      if (fieldName === "data") return false;
      // Skip confidence_scores if confidence_scores_table exists in UI config (computed field)
      // This handles the case where confidence_scores_table is a resolver field
      if (fieldName === "confidence_scores" && uiConfig.fields["confidence_scores_table"]?.uiComponent) {
        return false;
      }
      // Only include fields that have UI directives configured
      return uiConfig.fields[fieldName]?.uiComponent;
    })
    .reduce((acc, fieldName) => {
      const groupName =
        uiConfig.fields[fieldName]?.uiComponent?.config?.group || "default";
      if (!acc[groupName]) {
        acc[groupName] = [];
      }
      acc[groupName].push(fieldName);
      return acc;
    }, {});

  const sortedGroups = Object.keys(fieldsByGroup).sort((a, b) => {
    const groupAConfig = uiGroups?.find((g) => g.name === a);
    const groupBConfig = uiGroups?.find((g) => g.name === b);
    const priorityA = groupAConfig?.priority ?? (a === "default" ? 99 : 50);
    const priorityB = groupBConfig?.priority ?? (b === "default" ? 99 : 50);
    return priorityA - priorityB;
  });

  return (
    <div>
      {sortedGroups.map((groupName) => {
        const groupFields = fieldsByGroup[groupName].sort((a, b) => {
          const priorityA =
            uiConfig.fields[a]?.uiComponent?.config?.priority || 99;
          const priorityB =
            uiConfig.fields[b]?.uiComponent?.config?.priority || 99;
          return priorityA - priorityB;
        });

        const groupConfig = uiGroups?.find((g) => g.name === groupName);

        // Check if this group has only boolean badges and all are false
        const booleanBadgeFields = groupFields.filter(
          (fieldName) =>
            uiConfig.fields[fieldName]?.uiComponent?.type === "BADGE" &&
            typeof data[fieldName] === "boolean"
        );

        const allBooleanBadgesFalse =
          booleanBadgeFields.length > 0 &&
          booleanBadgeFields.every((fieldName) => !data[fieldName]);

        // Always render groups expanded, never as Collapsible
        return (
          <div key={groupName} className="mb-2">
            {groupName !== "default" && groupConfig && (
              <p className="text-sm font-medium mb-1">
                {groupConfig.label || groupName}
              </p>
            )}
            {allBooleanBadgesFalse && booleanBadgeFields.length > 0 && (
              <p className="text-sm text-muted-foreground italic mb-2">
                No classification matches found
              </p>
            )}
            {groupFields.map((fieldName) => {
              let fieldData = data[fieldName];
              const fieldConfig = uiConfig.fields[fieldName];
              
              // Special handling for confidence_scores_table - compute client-side if missing
              // This is a computed resolver field that transforms confidence_scores into table format
              if (fieldName === "confidence_scores_table" && (!fieldData || fieldData === null || fieldData === undefined)) {
                const confidenceScores = data.confidence_scores;
                if (confidenceScores && typeof confidenceScores === "object") {
                  // Map field names to display labels (matching server-side resolver)
                  const fieldLabels = {
                    custom_404: "Custom 404",
                    login_page: "Login Page",
                    webapp: "Webapp",
                    old_looking: "Old-Looking Site",
                    parked_domain: "Parked Domain",
                  };
                  
                  // Transform object to array of table rows (matching server-side resolver)
                  fieldData = Object.entries(confidenceScores)
                    .map(([key, value]) => {
                      const numValue = typeof value === "number" ? value : parseFloat(value) || 0;
                      return {
                        Category: fieldLabels[key] || key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
                        Confidence: `${(numValue * 100).toFixed(2)}%`,
                        Value: numValue, // Keep raw value for sorting
                      };
                    })
                    .sort((a, b) => b.Value - a.Value); // Sort by confidence descending
                }
              }
              
              // Special handling for screenshot_url IMAGE field
              // If screenshot_url is missing but we have bucket/key, use ScreenshotImage component
              if (
                fieldName === "screenshot_url" &&
                (!fieldData || fieldData === null || fieldData === undefined) &&
                fieldConfig?.uiComponent?.type === "IMAGE" &&
                data.screenshot_bucket &&
                data.screenshot_key
              ) {
                // Try to get ScreenshotImage component - it should be auto-loaded
                const ScreenshotImage = Components.ScreenshotImage;
                if (ScreenshotImage) {
                  const label = fieldConfig.uiComponent.config?.label || fieldName.replace(/_/g, " ");
                  return (
                    <div key={fieldName} className="mb-1">
                      {!fieldConfig.uiComponent.config?.hideLabel && (
                        <p className="text-xs capitalize text-muted-foreground">{label}</p>
                      )}
                      <ScreenshotImage
                        bucket={data.screenshot_bucket}
                        fileKey={data.screenshot_key}
                        {...fieldConfig.uiComponent.config}
                      />
                    </div>
                  );
                } else {
                  // Fallback: log warning and render a placeholder
                  console.warn("[DirectiveRenderer] ScreenshotImage component not found. Bucket:", data.screenshot_bucket, "Key:", data.screenshot_key);
                  return (
                    <div key={fieldName} className="mb-1">
                      <p className="text-xs capitalize text-muted-foreground">
                        {fieldConfig.uiComponent.config?.label || fieldName.replace(/_/g, " ")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Screenshot available (bucket: {data.screenshot_bucket}, key: {data.screenshot_key})
                      </p>
                    </div>
                  );
                }
              }
              
              return renderField(fieldName, fieldData, fieldConfig);
            })}
          </div>
        );
      })}
    </div>
  );
};

registerComponent("UIDirectiveRenderer", DirectiveRenderer);

export default DirectiveRenderer;
