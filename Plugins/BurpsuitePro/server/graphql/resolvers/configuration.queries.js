import PenPal from "meteor/penpal";
import _ from "lodash";
import fetch from "node-fetch";
import AbortController from "abort-controller";
import {
  PLUGIN_NAME,
  SETTINGS_STORE,
  DEFAULT_PENPAL_SETTINGS
} from "../../constants.js";

export default {
  async getBurpsuiteProConfiguration(root, args, context) {
    const penpal_settings =
      PenPal.DataStore.fetch(PLUGIN_NAME, SETTINGS_STORE, {})[0] ??
      DEFAULT_PENPAL_SETTINGS;

    if (penpal_settings.rest_url === "") {
      // We can't query the REST API until this is set
      return {
        penpal_settings
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, penpal_settings.rest_timeout);

    let result = { penpal_settings };
    try {
      const config_url = `${penpal_settings.rest_url}/burp/configuration`;
      const req = await fetch(config_url, {
        signal: controller.signal
      });
      const json = await req.json();
      result = _.extend(result, json);
      delete penpal_settings.rest_error;
    } catch (error) {
      if (error.name === "AbortError") {
        penpal_settings.rest_error = {
          code: 500,
          message: "Request timed out"
        };
      } else {
        penpal_settings.rest_error = { code: 500, message: error.message };
      }
    } finally {
      clearTimeout(timeout);
    }

    return result;
  }
};
