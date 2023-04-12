import { types, resolvers, loaders } from "./graphql";
import PenPal from "@penpal/core";

PenPal.Test = {};

const BasePlugin = {
  loadPlugin() {
    return {
      graphql: {
        types,
        resolvers,
      },
    };
  },
};

export default BasePlugin;
