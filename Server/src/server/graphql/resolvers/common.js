import { Meteor } from "meteor/meteor";
import _ from "lodash";

const throwPermissionDeniedError = () => {
  if (Meteor.settings.private.disableGraphQLAuth !== true) {
    throw new Meteor.Error(403, "Permission denied");
  }
};

// Calling this function will throw an error if the `role_name` is not in the `user`'s roles
export const restrictToRole = (user, role_name) => {
  if (!_.includes(user?.settings?.roles ?? [], role_name)) {
    throwPermissionDeniedError();
  }
};

// Calling this function will not throw an error if any of the `role_names` are in the `user`'s roles
export const restrictToRoles = (user, role_names) =>
  _.some(role_names, role_name => restrictToRole(user, role_name));

// Calling this function will throw an error if the user is not logged in
export const restrictToLoggedIn = user => {
  if (user === undefined || user === null) {
    throwPermissionDeniedError();
  }
};
