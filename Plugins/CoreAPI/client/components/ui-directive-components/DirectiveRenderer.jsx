import React from "react";
import { useQuery } from "@apollo/client";
import { Components, registerComponent } from "@penpal/core";
import GET_UI_DIRECTIVES from "./queries/get-ui-directives";
import { ChevronDownIcon } from "@heroicons/react/24/solid";

const { Spinner, Collapsible, CollapsibleTrigger, CollapsibleContent } =
  Components;

// --- Component Mapper ---
// Maps UIComponentType string to the actual React component
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

  const fieldsByGroup = Object.keys(data).reduce((acc, fieldName) => {
    const groupName =
      uiConfig.fields[fieldName]?.uiComponent?.config?.group || "default";
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(fieldName);
    return acc;
  }, {});

  const sortedGroups = Object.keys(fieldsByGroup).sort((a, b) => {
    const groupAConfig = uiConfig.typeDirectives?.uiGroup?.find(
      (g) => g.name === a
    );
    const groupBConfig = uiConfig.typeDirectives?.uiGroup?.find(
      (g) => g.name === b
    );
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

        const groupConfig = uiConfig.typeDirectives?.uiGroup?.find(
          (g) => g.name === groupName
        );

        if (groupName !== "default" && groupConfig) {
          return (
            <Collapsible
              key={groupName}
              defaultOpen={!groupConfig.collapsible}
              className="group"
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <p className="text-sm font-medium">
                  {groupConfig.label || groupName}
                </p>
                <ChevronDownIcon className="h-5 w-5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                {groupFields.map((fieldName) =>
                  renderField(
                    fieldName,
                    data[fieldName],
                    uiConfig.fields[fieldName]
                  )
                )}
              </CollapsibleContent>
            </Collapsible>
          );
        }

        return (
          <div key={groupName}>
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
