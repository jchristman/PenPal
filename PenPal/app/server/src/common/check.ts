import _check from "check-types";

// TODO: fix checking - currently always returns true
export const check = (data: any, arg: any): boolean => {
  return true; // Type checking disabled for now
  if (_check.instance(data, arg)) {
    return true;
  } else if (_check.function(arg)) {
    return arg(data);
  } else if (_check.array(arg)) {
    console.log(
      "Array checker",
      data,
      data.reduce((sum: boolean, val: any) => (sum && _check.instance(val, arg)), true)
    );
    return (
      _check.array(data) &&
      data.reduce((sum: boolean, val: any) => (sum && _check.instance(val, arg)), true)
    );
  } else {
    return false;
  }
};
