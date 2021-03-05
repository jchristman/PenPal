import PenPal from "meteor/penpal";
import { Mongo } from "meteor/mongo";
import _ from "lodash";

export default {
  async setCoreAPIConfiguration(root, { configuration }, context) {
    let currConfig = PenPal.DataStore.fetch("CoreAPI", "Configuration", {});
    if (currConfig.length > 0) {
      PenPal.DataStore.update(
        "CoreAPI",
        "Configuration",
        { _id: `${currConfig[0]._id}` },
        { $set: { hookURL: configuration.hookURL } }
      );
      return {
        status: "Updated Configuration",
        was_success: true,
        affected_records: [currConfig[0]._id]
      };
    } else {
      let addedConfig = PenPal.DataStore.insert("CoreAPI", "Configuration", {
        hookURL: configuration.hookURL
      });
      if (addedConfig) {
        return {
          status: "Inserted Configuration",
          was_success: true,
          affected_records: [addedConfig]
        };
      } else {
        return {
          status: "Configuration Update Failed",
          was_success: false,
          affected_records: []
        };
      }
    }
  }
};
