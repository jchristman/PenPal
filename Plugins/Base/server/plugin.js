import { types, resolvers, loaders } from "./graphql";
import PenPal from "PenPal";

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
