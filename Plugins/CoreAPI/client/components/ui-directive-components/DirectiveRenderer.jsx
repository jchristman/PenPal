import React from "react";
import { useQuery } from "@apollo/client";
import { Components, registerComponent } from "@penpal/core";
import GET_UI_DIRECTIVES from "./queries/get-ui-directives";
import { ChevronDownIcon } from "@heroicons/react/24/solid";

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
  const fieldsByGroup = Object.keys(data)
    .filter((fieldName) => fieldName !== "data")
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

        // Always render groups expanded, never as Collapsible
        return (
          <div key={groupName} className="mb-2">
            {groupName !== "default" && groupConfig && (
              <p className="text-sm font-medium mb-1">
                {groupConfig.label || groupName}
              </p>
            )}
            {groupFields.map((fieldName) =>
              renderField(
                fieldName,
                data[fieldName],
                uiConfig.fields[fieldName]
              )
            )}
          </div>
        );
      })}
    </div>
  );
};

registerComponent("UIDirectiveRenderer", DirectiveRenderer);

export default DirectiveRenderer;
