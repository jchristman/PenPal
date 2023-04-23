import Manifest from "./manifest.json" assert { type: "json" };
const { name } = Manifest;

export const SETTINGS_STORE = "Settings";
export const PLUGIN_NAME = name;
export const DEFAULT_PENPAL_SETTINGS = {
  rest_url: "",
  rest_timeout: 2000,
};
