import PenPal from "meteor/penpal";
import {
  DEFAULT_PENPAL_SETTINGS,
  SETTINGS_STORE,
  PLUGIN_NAME
} from "../../constants.js";
import queries from "./configuration.queries.js";

export default {
  async setBurpsuiteProConfiguration(
    root,
    { configuration: jsonConfiguration },
    context
  ) {
    const configuration = JSON.parse(jsonConfiguration);
    const {
      penpal_settings: { rest_url = "", rest_timeout = 2000 } = {}
    } = configuration;

    let current_config = PenPal.DataStore.fetch(
      PLUGIN_NAME,
      SETTINGS_STORE,
      {}
    );
    if (current_config.length > 0) {
      PenPal.DataStore.update(
        PLUGIN_NAME,
        SETTINGS_STORE,
        { _id: current_config[0]._id },
        { $set: { rest_url, rest_timeout } }
      );
    } else {
      PenPal.DataStore.insert(PLUGIN_NAME, SETTINGS_STORE, {
        rest_url,
        rest_timeout
      });
    }

    return await queries.getBurpsuiteProConfiguration();
  }
};
