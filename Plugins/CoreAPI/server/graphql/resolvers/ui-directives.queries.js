import PenPal from "#penpal/core";

export default {
  async getUIDirectives(parent, { typeName }, context, info) {
    return PenPal.API.UIDirectives.Get(typeName);
  },
};
