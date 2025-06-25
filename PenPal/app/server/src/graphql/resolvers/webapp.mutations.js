import { restrictToRole } from "./common.js";

// ----------------------------------------------------------
// Mutation resolvers

export default {
  async signup(root, { email, password }, { user }) {
    return null;
  },

  async authenticateWithPassword(root, { email, password }, { user }) {
    return null;
  },

  async logout(root, { token }, { user }) {
    return null;
  },

  async sendVerificationEmail(root, { email }, { user }) {
    return null;
  },

  async verifyEmail(root, { token }, { user }) {
    return null
  },

  async updateUser(
    root,
    { user_id, update: { roles, enabled } = {} },
    { user }
  ) {
    return null;

  },

  async nop() {
    return false;
  }
};
