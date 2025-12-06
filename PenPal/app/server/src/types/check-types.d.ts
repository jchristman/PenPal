declare module 'check-types' {
  interface CheckTypes {
    instance(data: any, type: any): boolean;
    function(data: any): boolean;
    array(data: any): boolean;
  }

  const check: CheckTypes;
  export = check;
}
