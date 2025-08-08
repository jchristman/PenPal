import _check from "check-types";

// TODO: fix checking
export const check = (data, arg) => {
  return true;
  if (_check.instance(data, arg)) {
    return true;
  } else if (_check.function(arg)) {
    return arg(data);
  } else if (_check.array(arg)) {
    console.log(
      "Array checker",
      data,
      data.reduce((sum, val) => (sum &= _check.instance(val, arg)), true)
    );
    return (
      _check.array(data) &&
      data.reduce((sum, val) => (sum &= _check.instance(val, arg)), true)
    );
  } else {
    return false;
  }
};
