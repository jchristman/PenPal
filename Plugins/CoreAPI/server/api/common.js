import _ from "lodash";

// This function will search for the word "test" in the id field of any passed in object and return true or false
export const isTestData = arg => {
  if (Array.isArray(arg)) {
    return _.some(arg, isTestData);
  } else {
    if (typeof arg === "string") {
      return /test/.test(arg);
    } else {
      return /test/.test(arg.id ?? "");
    }
  }
};

export const required_field = (obj, field_name, operation_name) => {
  if (obj[field_name] === undefined) {
    throw new Meteor.Error(
      500,
      `${field_name} field is required for ${operation_name}`
    );
  }
};
