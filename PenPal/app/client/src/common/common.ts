
// ----------------------------------------------------------------------------

export const Regex = {
  ip_address: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
};

export const Constants = {
  Role: {
    Admin: "Role.Admin",
    User: "Role.User",
  },
};

export const isFunction = (obj: any): boolean =>
  !!(obj && obj.constructor && obj.call && obj.apply);
