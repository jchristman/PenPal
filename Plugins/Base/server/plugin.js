import { types, resolvers, loaders } from "./graphql";
import PenPal from "meteor/penpal";

PenPal.Test = {};

const BasePlugin = {
  loadPlugin() {
    return {
      graphql: {
        types,
        resolvers
      }
    };
  }
};

export default BasePlugin;
