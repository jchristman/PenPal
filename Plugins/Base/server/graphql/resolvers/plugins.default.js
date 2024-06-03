import PenPal from "#penpal/core";

export default {
  Plugin: {
    async id(root, args, context) {
      return root.id;
    },

    async name({ id }, args, context) {
      return PenPal.LoadedPlugins[id].name;
    },

    async version({ id }, args, context) {
      return PenPal.LoadedPlugins[id].version;
    },

    async settings({ id }, args, context) {
      return PenPal.LoadedPlugins[id].settings;
    },

    async jobs({ id }, args, context) {
      return PenPal.LoadedPlugins[id].jobs;
    },
  },
};
