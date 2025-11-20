// import { Constants } from "#penpal/common";
import _ from "lodash";

import { restrictToRole, restrictToLoggedIn } from "./common";
import type { IResolvers } from '@graphql-tools/utils';

interface WebappUser {
  _id: string;
  id: string;
  settings?: {
    enabled?: boolean;
  };
  [key: string]: any;
}

interface GetUsersFilter {
  active?: boolean;
  pending?: boolean;
}

interface GraphQLContext {
  user?: WebappUser;
  [key: string]: any;
}

export default {
  async currentUser(root: any, args: any, { user }: GraphQLContext): Promise<WebappUser | undefined> {
    restrictToLoggedIn(user);
    return user;
  },

  async getUsers(
    root: any,
    { filter: { active, pending } = {} }: { filter?: GetUsersFilter },
    { user }: GraphQLContext
  ): Promise<WebappUser[]> {
    //restrictToRole(user, Constants.Role.Admin);

    const query: Record<string, any> = {};

    switch (true) {
      case active:
        query["settings.enabled"] = true;
        break;
      case pending:
        query["settings.enabled"] = false;
        break;
    }

    // TODO: Add new authentication
    let users: WebappUser[] = []; //await Meteor.users.find(query).fetch();
    users = users.map(({ _id, ...rest }) => ({ ...rest, _id, id: _id }));

    // TODO: Re-implement loaders
    /*for (user of users) {
      await loaders.webappUsersLoader.prime(user.id, user);
    }*/

    return users;
  },

  async nop(): Promise<boolean> {
    return false;
  },
} as IResolvers;
