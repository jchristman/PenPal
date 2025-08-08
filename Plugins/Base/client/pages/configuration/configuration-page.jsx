import React, { useState, useEffect } from "react";
import _ from "lodash";
import { Components, Hooks, registerComponent } from "@penpal/core";

// IMPORTANT: Do not destructure Components at module scope.
// Refer to components via Components.ComponentName at render time to avoid load-order undefineds.

const transform_key = (key) => key.replaceAll("_", " ");

const ConfigurationPageSection = ({
  handleConfigChange,
  path,
  config,
  depth = 0,
  uiMeta = null,
}) => {
  const { toast } = Hooks.useToast();

  // Handle primitive values directly
  const valueType = typeof config;
  if (config === null || config === undefined) {
    const label = transform_key(path.split(".").pop() || "");
    return (
      <div className="space-y-2">
        <Components.Label htmlFor={path} className="capitalize">
          {label}
        </Components.Label>
        <Components.Input
          id={path}
          value={""}
          onChange={(event) => handleConfigChange(path, event.target.value)}
        />
      </div>
    );
  }

  // Error shape from server
  if (valueType === "object" && config.__typename === "PenPalError") {
    const { code, message } = config;
    useEffect(() => {
      toast({
        title: "Configuration Error",
        description: `Error ${code}: ${message}`,
        variant: "destructive",
      });
    }, [code, message]);
    return null;
  }

  if (valueType === "string") {
    return (
      <div className="space-y-2">
        <Components.Label htmlFor={path} className="capitalize">
          {transform_key(path.split(".").pop() || "")}
        </Components.Label>
        <Components.Input
          id={path}
          value={config}
          onChange={(event) => handleConfigChange(path, event.target.value)}
        />
      </div>
    );
  }

  if (valueType === "boolean") {
    return (
      <div className="flex items-center space-x-2">
        <Components.Checkbox
          id={path}
          checked={config}
          onCheckedChange={(checked) => handleConfigChange(path, checked)}
        />
        <Components.Label htmlFor={path} className="capitalize">
          {transform_key(path.split(".").pop() || "")}
        </Components.Label>
      </div>
    );
  }

  if (valueType === "number") {
    return (
      <div className="space-y-2">
        <Components.Label htmlFor={path} className="capitalize">
          {transform_key(path.split(".").pop() || "")}
        </Components.Label>
        <Components.Input
          id={path}
          type="number"
          value={config}
          onChange={(event) => {
            const raw = event.target.value;
            const next = raw === "" ? 0 : Number(raw);
            handleConfigChange(path, next);
          }}
        />
      </div>
    );
  }

  if (Array.isArray(config)) {
    return (
      <div className="space-y-2">
        <Components.Label htmlFor={path} className="capitalize">
          {transform_key(path.split(".").pop() || "")}
        </Components.Label>
        <Components.Input
          id={path}
          value={config.join(",")}
          onChange={(event) => {
            const raw = event.target.value;
            // Keep raw string in local state to avoid cursor jump; commit array on save server-side
            handleConfigChange(path, raw);
          }}
        />
      </div>
    );
  }

  // At this point, config should be a plain object
  // Generic conditional UI driven by uiMeta
  if (uiMeta && _.isPlainObject(config)) {
    const conditional = (uiMeta.conditional || []).find((c) => c.path === path);
    if (conditional) {
      const controllerKey = conditional.controller;
      const controllerValue = !!config[controllerKey];
      const allow = new Set(
        controllerValue
          ? conditional.showWhenTrue || []
          : conditional.showWhenFalse || []
      );
      const filtered = Object.entries(config).filter(([k]) => {
        if (k === "__typename") return false;
        if (k === controllerKey) return true;
        if (allow.size === 0) return true;
        return allow.has(k);
      });
      return (
        <div className="space-y-3">
          {filtered.map(([innerKey, innerVal]) => (
            <ConfigurationPageSection
              key={`${path}.${innerKey}`}
              handleConfigChange={handleConfigChange}
              path={`${path}.${innerKey}`}
              depth={depth + 1}
              config={innerVal}
              uiMeta={uiMeta}
            />
          ))}
        </div>
      );
    }
  }

  // Render its keys recursively for generic objects
  const entries = Object.entries(config).filter(([k]) => k !== "__typename");
  const children = entries.map(([key, childValue]) => {
    const key_path = `${path}.${key}`;
    switch (typeof childValue) {
      case "string":
        return (
          <div key={key_path} className="space-y-2">
            <Components.Label htmlFor={key_path} className="capitalize">
              {transform_key(key)}
            </Components.Label>
            <Components.Input
              id={key_path}
              value={childValue}
              onChange={(event) =>
                handleConfigChange(key_path, event.target.value)
              }
            />
          </div>
        );
      case "boolean":
        return (
          <div key={key_path} className="flex items-center space-x-2">
            <Components.Checkbox
              id={key_path}
              checked={childValue}
              onCheckedChange={(checked) =>
                handleConfigChange(key_path, checked)
              }
            />
            <Components.Label htmlFor={key_path} className="capitalize">
              {transform_key(key)}
            </Components.Label>
          </div>
        );
      case "number":
        return (
          <div key={key_path} className="space-y-2">
            <Components.Label htmlFor={key_path} className="capitalize">
              {transform_key(key)}
            </Components.Label>
            <Components.Input
              id={key_path}
              type="number"
              value={childValue}
              onChange={(event) =>
                handleConfigChange(key_path, event.target.value)
              }
            />
          </div>
        );
      case "object": {
        const value = childValue;
        if (value === null) {
          return (
            <div key={key_path} className="space-y-2">
              <Components.Label htmlFor={key_path} className="capitalize">
                {transform_key(key)}
              </Components.Label>
              <Components.Input
                id={key_path}
                value={""}
                onChange={(event) =>
                  handleConfigChange(key_path, event.target.value)
                }
              />
            </div>
          );
        }
        // Special handling for Nmap scan mode sections (use_top_ports toggle)
        const isScanModeSection =
          _.isPlainObject(value) &&
          (Object.prototype.hasOwnProperty.call(value, "use_top_ports") ||
            (Object.prototype.hasOwnProperty.call(value, "top_ports") &&
              (Object.prototype.hasOwnProperty.call(value, "tcp_ports") ||
                Object.prototype.hasOwnProperty.call(value, "udp_ports"))));
        if (isScanModeSection) {
          const useTop = !!value.use_top_ports;
          return (
            <div key={key_path} className="space-y-3">
              {/* Use Top Ports toggle */}
              <div className="flex items-center space-x-2">
                <Components.Checkbox
                  id={`${key_path}.use_top_ports`}
                  checked={useTop}
                  onCheckedChange={(checked) =>
                    handleConfigChange(`${key_path}.use_top_ports`, checked)
                  }
                />
                <Components.Label
                  htmlFor={`${key_path}.use_top_ports`}
                  className="capitalize"
                >
                  Use Top Ports
                </Components.Label>
              </div>

              {/* Conditionally show Top Ports OR TCP/UDP fields */}
              {useTop ? (
                <div className="space-y-2">
                  <Components.Label
                    htmlFor={`${key_path}.top_ports`}
                    className="capitalize"
                  >
                    Top Ports
                  </Components.Label>
                  <Components.Input
                    id={`${key_path}.top_ports`}
                    type="number"
                    value={value.top_ports ?? ""}
                    onChange={(event) =>
                      handleConfigChange(
                        `${key_path}.top_ports`,
                        event.target.value
                      )
                    }
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Components.Label
                      htmlFor={`${key_path}.tcp_ports`}
                      className="capitalize"
                    >
                      Tcp Ports
                    </Components.Label>
                    <Components.Input
                      id={`${key_path}.tcp_ports`}
                      value={
                        (Array.isArray(value.tcp_ports)
                          ? value.tcp_ports.join(",")
                          : value.tcp_ports) ?? ""
                      }
                      onChange={(event) =>
                        handleConfigChange(
                          `${key_path}.tcp_ports`,
                          event.target.value
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Components.Label
                      htmlFor={`${key_path}.udp_ports`}
                      className="capitalize"
                    >
                      Udp Ports
                    </Components.Label>
                    <Components.Input
                      id={`${key_path}.udp_ports`}
                      value={
                        (Array.isArray(value.udp_ports)
                          ? value.udp_ports.join(",")
                          : value.udp_ports) ?? ""
                      }
                      onChange={(event) =>
                        handleConfigChange(
                          `${key_path}.udp_ports`,
                          event.target.value
                        )
                      }
                    />
                  </div>
                </>
              )}

              {/* Any additional flags such as fast_scan */}
              {Object.prototype.hasOwnProperty.call(value, "fast_scan") && (
                <div className="flex items-center space-x-2">
                  <Components.Checkbox
                    id={`${key_path}.fast_scan`}
                    checked={!!value.fast_scan}
                    onCheckedChange={(checked) =>
                      handleConfigChange(`${key_path}.fast_scan`, checked)
                    }
                  />
                  <Components.Label
                    htmlFor={`${key_path}.fast_scan`}
                    className="capitalize"
                  >
                    Fast Scan
                  </Components.Label>
                </div>
              )}
            </div>
          );
        }
        // If this is an Array, render as a comma-separated string for now
        if (Array.isArray(value)) {
          return (
            <div key={key_path} className="space-y-2">
              <Components.Label htmlFor={key_path} className="capitalize">
                {transform_key(key)}
              </Components.Label>
              <Components.Input
                id={key_path}
                value={value.join(",")}
                onChange={(event) =>
                  handleConfigChange(key_path, event.target.value.split(","))
                }
              />
            </div>
          );
        }
        // Guard for boxed primitives like String/Number/Boolean objects
        if (!_.isPlainObject(value)) {
          return (
            <div key={key_path} className="space-y-2">
              <Components.Label htmlFor={key_path} className="capitalize">
                {transform_key(key)}
              </Components.Label>
              <Components.Input
                id={key_path}
                value={String(value)}
                onChange={(event) =>
                  handleConfigChange(key_path, event.target.value)
                }
              />
            </div>
          );
        }
        return (
          <div key={key_path} className="space-y-3">
            <div className="text-sm font-semibold mb-1">
              {transform_key(key)}
            </div>
            <ConfigurationPageSection
              handleConfigChange={handleConfigChange}
              path={key_path}
              depth={depth + 1}
              config={value}
              uiMeta={uiMeta}
            />
          </div>
        );
      }
      default:
        return <p key={key_path}>Unknown configuration type</p>;
    }
  });

  return <div className="space-y-4">{children}</div>;
};

const ConfigurationPage = ({ localConfig, handleConfigChange }) => {
  // Generic rendering for all plugins (one section per top-level key)
  const config_items = Object.keys(localConfig ?? {});
  const uiMeta = localConfig?._ui || localConfig?.__ui || null;
  return (
    <div className="w-full h-full space-y-6">
      {(() => {
        // If sections metadata exists, render in that order with labels
        const sections = uiMeta?.sections;
        if (Array.isArray(sections) && sections.length > 0) {
          return sections.map(({ path: sectionPath, label }) => {
            // Resolve value at sectionPath from localConfig
            const segments = sectionPath.split(".");
            let value = localConfig;
            for (const seg of segments) {
              if (!value) break;
              value = value[seg];
            }
            if (value === undefined) return null;
            return (
              <Components.Card key={sectionPath}>
                <Components.CardContent className="p-6 space-y-3">
                  <div className="text-md font-semibold mb-2">
                    {label || transform_key(segments[segments.length - 1])}
                  </div>
                  <ConfigurationPageSection
                    handleConfigChange={handleConfigChange}
                    path={sectionPath}
                    config={value}
                    uiMeta={uiMeta}
                  />
                </Components.CardContent>
              </Components.Card>
            );
          });
        }

        // Fallback: render all top-level keys
        return config_items
          .filter((item) => item !== "__ui" && item !== "__typename")
          .map((item) => (
            <Components.Card key={item}>
              <Components.CardContent className="p-6 space-y-3">
                <div className="text-md font-semibold mb-2">
                  {transform_key(item)}
                </div>
                <ConfigurationPageSection
                  handleConfigChange={handleConfigChange}
                  path={item}
                  config={localConfig[item]}
                  uiMeta={uiMeta}
                />
              </Components.CardContent>
            </Components.Card>
          ));
      })()}
    </div>
  );
};

registerComponent("ConfigurationPage", ConfigurationPage);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ConfigurationPage;
