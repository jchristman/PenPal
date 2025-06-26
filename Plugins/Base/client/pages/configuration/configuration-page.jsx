import React, { useState, useEffect } from "react";
import _ from "lodash";
import { Components, Hooks, registerComponent } from "@penpal/core";

const { Card, CardContent } = Components.Card;
const { Tabs, TabsList, TabsTrigger, TabsContent } = Components.Tabs;
const { Checkbox } = Components.Checkbox;
const { Input } = Components.Input;
const { Label } = Components.Label;
const { useToast } = Hooks.useToast;

const transform_key = (key) => key.replaceAll("_", " ");

const ConfigurationPageSection = ({
  handleConfigChange,
  path,
  config: { __typename, ...rest },
  depth = 0,
}) => {
  const { toast } = useToast();

  const is_error = __typename === "PenPalError";
  let messageEffectConditions = [];
  if (is_error) {
    messageEffectConditions = [rest.code, rest.message];
  }

  useEffect(() => {
    if (__typename === "PenPalError") {
      toast({
        title: "Configuration Error",
        description: `Error ${rest.code}: ${rest.message}`,
        variant: "destructive",
      });
    }
  }, messageEffectConditions);

  const keys = Object.keys(rest);
  const children = _.map(keys, (key) => {
    const key_path = `${path}.${key}`;
    switch (typeof rest[key]) {
      case "string":
        return (
          <div key={key_path} className="space-y-2">
            <Label htmlFor={key_path} className="capitalize">
              {transform_key(key)}
            </Label>
            <Input
              id={key_path}
              value={rest[key]}
              onChange={(event) =>
                handleConfigChange(key_path, event.target.value)
              }
            />
          </div>
        );
      case "boolean":
        return (
          <div key={key_path} className="flex items-center space-x-2">
            <Checkbox
              id={key_path}
              checked={rest[key]}
              onCheckedChange={(checked) =>
                handleConfigChange(key_path, checked)
              }
            />
            <Label htmlFor={key_path} className="capitalize">
              {transform_key(key)}
            </Label>
          </div>
        );
      case "number":
        return (
          <div key={key_path} className="space-y-2">
            <Label htmlFor={key_path} className="capitalize">
              {transform_key(key)}
            </Label>
            <Input
              id={key_path}
              type="number"
              value={rest[key]}
              onChange={(event) =>
                handleConfigChange(key_path, event.target.value)
              }
            />
          </div>
        );
      case "object":
        if (rest[key] === null) {
          return null;
        }
        return (
          <div key={key_path} className="space-y-4">
            <h3 className="text-lg font-semibold capitalize">
              {transform_key(key)}
            </h3>
            <div className="pl-4 border-l-2 border-gray-200 space-y-4">
              <ConfigurationPageSection
                handleConfigChange={handleConfigChange}
                path={key_path}
                depth={depth + 1}
                config={rest[key]}
              />
            </div>
          </div>
        );
      default:
        return <p key={key_path}>Unknown configuration type</p>;
    }
  });

  return is_error ? null : <div className="space-y-4">{children}</div>;
};

const ConfigurationPage = ({ localConfig, handleConfigChange }) => {
  const [selectedTab, setSelectedTab] = useState(
    Object.keys(localConfig)?.[0] ?? ""
  );

  const config_items = Object.keys(localConfig);

  return (
    <div className="w-full h-full">
      <Tabs
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="w-full"
      >
        <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0">
          {config_items.map((item) => (
            <TabsTrigger
              key={item}
              value={item}
              disabled={localConfig[item] === null}
              className="capitalize"
            >
              {item.replace("_", " ")}
            </TabsTrigger>
          ))}
        </TabsList>

        {config_items.map((item) => (
          <TabsContent key={item} value={item} className="mt-6">
            <Card>
              <CardContent className="p-6">
                <ConfigurationPageSection
                  handleConfigChange={handleConfigChange}
                  path={item}
                  config={localConfig[item]}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

registerComponent("ConfigurationPage", ConfigurationPage);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ConfigurationPage;
