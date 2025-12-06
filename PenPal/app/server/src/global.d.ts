// Global type declarations
declare module '#penpal/plugins' {
  export const registerPlugins: () => Promise<void>;
}

declare module '#penpal/core' {
  const PenPal: any;
  export default PenPal;
}

declare module '#penpal/common' {
  export const Constants: any;
  export const Regex: any;
  export const isFunction: (obj: any) => boolean;
  export const check: (value: any, type: any, repr_value: string, repr_type: string) => boolean;
  export const check_manifest: (manifest: any) => boolean;
  export const check_plugin: (plugin: any) => boolean;
}

// GraphQL file imports
declare module '*.graphql' {
  const content: string;
  export default content;
}
