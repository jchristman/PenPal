import _check from "check-types";

export const check = (data, arg) => {
  if (_check.function(arg)) {
    return arg(data);
  } else {
    return check.instance(data, arg);
  }
};
