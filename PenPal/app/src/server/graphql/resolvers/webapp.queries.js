import { Meteor } from "meteor/meteor";
import { Constants } from "meteor/penpal";
import _ from "lodash";

import { restrictToRole, restrictToLoggedIn } from "./common.js";

export default {
  async currentUser(root, args, { user }) {
    restrictToLoggedIn(user);

    return user;
  },

  async getUsers(root, { filter: { active, pending } = {} }, { user }) {
    restrictToRole(user, Constants.Role.Admin);

    const query = {};

    switch (true) {
      case active:
        query["settings.enabled"] = true;
        break;
      case pending:
        query["settings.enabled"] = false;
        break;
    }

    let users = await Meteor.users.find(query).fetch();
    users = users.map(({ _id, ...rest }) => ({ _id, id: _id, ...rest }));

    // TODO: Re-implement loaders
    /*for (user of users) {
      await loaders.webappUsersLoader.prime(user.id, user);
    }*/

    return users;
  },

  async nop() {
    return false;
  }
};
