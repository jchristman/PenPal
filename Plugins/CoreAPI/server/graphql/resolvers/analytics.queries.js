import { Random } from "meteor/random";

// Generate a random analytics ID that can serve as the cache key
// and let resolvers do the heavy lifting based on if they are requested or not
export const ANALYTICS_ID = Random.id();

export default {
  async getCoreAPIAnalytics(root, args, context) {
    return { id: ANALYTICS_ID };
  }
};
