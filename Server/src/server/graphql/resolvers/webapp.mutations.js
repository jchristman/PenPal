import { Meteor } from "meteor/meteor";
import { Constants } from "meteor/penpal";
import { Accounts } from "meteor/accounts-base";
import { Random } from "meteor/random";

import { restrictToRole } from "./common.js";

// ----------------------------------------------------------
// Authentication Functions

const _signup = async (email, password) => {
  if (Accounts._options.forbidClientAccountCreation) {
    throw new Meteor.Error(500, "Signups are currently forbidden");
  }

  const options = { email, password };
  const userId = await Accounts.createUser(options);

  if (userId === undefined) {
    throw new Meteor.Error(500, "Signup failed");
  }

  const user_settings = {
    roles: [],
    enabled: true
  };

  const is_first_user = (await Meteor.users.rawCollection().count()) === 1;
  if (
    !(Meteor.settings.private.REGISTRATION?.REQUIRE_ADMIN_APPROVAL ?? false) ||
    is_first_user
  ) {
    // If we are the first user, become an admin
    if (is_first_user) {
      user_settings.roles.push(Constants.Role.Admin);
    } else {
      user_settings.roles.push(Constants.Role.User);
    }
  } else {
    user_settings.enabled = false;
  }

  const update = { settings: user_settings };

  await Meteor.users.update({ _id: userId }, { $set: update });

  if (Accounts._options.sendVerificationEmail) {
    Accounts.sendVerificationEmail(userId, email);
  }

  return await _authenticateWithPassword(email, password);
};

// We are hacking some Meteor internals here. Nothing to see here. Move along.
// https://github.com/orionsoft/meteor-apollo-accounts/blob/master/meteor-server/src/callMethod.js
//        ^---- that's the basis for what I'm doing here
const loginHandler = Meteor.default_server.method_handlers["login"];
const genConnection = () => ({ id: Random.id(), close() {} });
const context = { connection: genConnection(), setUserId() {} };
const _authenticateWithPassword = async (email, password) => {
  const { settings: { enabled } = {} } =
    (await Meteor.users.findOne({
      emails: { $elemMatch: { address: email } }
    })) ?? {};
  if (enabled !== undefined && enabled === false) {
    throw new Meteor.Error(
      403,
      "An admin must approve your account prior to login"
    );
  }

  try {
    const { id, ...rest } = loginHandler.call(context, {
      user: { email },
      password
    });

    return { userId: id, ...rest };
  } catch (e) {
    throw new Meteor.Error(403, "Login failed");
  }
};

const logoutHandler = Meteor.default_server.method_handlers["logout"];
const _logout = async (userId, token) => {
  const hashedToken = Accounts._hashLoginToken(token);
  Accounts.destroyToken(userId, hashedToken);
  const connection = genConnection();
  Accounts._successfulLogout(connection, userId);
  return true;
};

const notImplemented = () => {
  throw new Meteor.Error(500, "Not yet implemented");
};

const _sendVerificationEmail = async (email) => {
  notImplemented();
};

const _verifyEmail = async (token) => {
  notImplemented();
};

// ----------------------------------------------------------
// Helper Functions

const loggedInError = (userId) => {
  if (userId !== undefined) {
    throw new Meteor.Error(500, "User is already logged in");
  }
};

// ----------------------------------------------------------
// Mutation resolvers

export default {
  async signup(root, { email, password }, { user }) {
    loggedInError(user?._id);
    return await _signup(email, password);
  },

  async authenticateWithPassword(root, { email, password }, { user }) {
    loggedInError(user?._id);
    return await _authenticateWithPassword(email, password);
  },

  async logout(root, { token }, { user }) {
    if (user?._id === undefined) {
      throw new Meteor.Error(500, "User is not logged in");
    }

    return await _logout(token, user._id);
  },

  async sendVerificationEmail(root, { email }, { user }) {
    loggedInError(user?._id);
    return await _sendVerificationEmail(email);
  },

  async verifyEmail(root, { token }, { user }) {
    loggedInError(user?._id);
    return await _verifyEmail(token);
  },

  async updateUser(
    root,
    { user_id, update: { roles, enabled } = {} },
    { user }
  ) {
    restrictToRole(user, Constants.Role.Admin);

    const updated_user = await Meteor.users.findOne({ _id: user_id });
    if (updated_user === undefined) {
      throw new Meteor.Error(404, "User not found");
    }
    updated_user.id = updated_user._id;

    const update = {};
    if (roles !== undefined) {
      update["settings.roles"] = roles;
      updated_user.settings.roles = roles;
    }
    if (enabled !== undefined) {
      update["settings.enabled"] = enabled;
      updated_user.settings.enabled = enabled;
    }

    if (Object.keys(update).length === 0) {
      // Then no updates were made. Just return
      return updated_user;
    }

    await Meteor.users.update({ _id: updated_user.id }, { $set: update });

    return updated_user;
  },

  async nop() {
    return false;
  }
};
