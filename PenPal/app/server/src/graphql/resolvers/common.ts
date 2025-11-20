import _ from "lodash";

interface User {
  settings?: {
    roles?: string[];
    enabled?: boolean;
    [key: string]: any;
  };
  [key: string]: any;
}

const throwPermissionDeniedError = (): never => {
  throw new Error("[403] Permission denied");
};

// Calling this function will throw an error if the `role_name` is not in the `user`'s roles
export const restrictToRole = (user: User | undefined | null, role_name: string): void => {
  if (!_.includes(user?.settings?.roles ?? [], role_name)) {
    throwPermissionDeniedError();
  }
};

// Calling this function will not throw an error if any of the `role_names` are in the `user`'s roles
export const restrictToRoles = (user: User | undefined | null, role_names: string[]): void => {
  _.some(role_names, (role_name: string) => restrictToRole(user, role_name));
};

// Calling this function will throw an error if the user is not logged in
export const restrictToLoggedIn = (user: User | undefined | null): void => {
  if (user === undefined || user === null) {
    throwPermissionDeniedError();
  }
};
