import React, { createContext, useContext, useState, useEffect } from "react";
import { Components, registerComponent, registerHook } from "@penpal/core";
import { useQuery } from "@apollo/client";

import IntrospectionQuery from "./introspection-provider-gql.ts";

interface IntrospectionData {
  loading: boolean;
  types: Record<string, any>;
  queries: Record<string, any>;
  mutations: Record<string, any>;
}

interface IntrospectionProviderProps {
  children?: React.ReactNode;
}

const IntrospectionContext = createContext<IntrospectionData>({
  loading: true,
  types: {},
  queries: {},
  mutations: {},
});

const IntrospectionProvider: React.FC<IntrospectionProviderProps> = ({ children }) => {
  const {
    loading: introspection_loading,
    error: introspection_error,
    data: { __schema } = {},
  } = useQuery(IntrospectionQuery);

  let types: Record<string, any> = {},
    queries: Record<string, any> = {},
    mutations: Record<string, any> = {};
  if (!introspection_loading && __schema) {
    for (let type of __schema.types ?? []) {
      types[type.name] = type;
    }
    if (__schema.queryType?.fields) {
      for (let query of __schema.queryType.fields) {
        queries[query.name] = query;
      }
    }
    if (__schema.mutationType?.fields) {
      for (let mutation of __schema.mutationType.fields) {
        mutations[mutation.name] = mutation;
      }
    }
  }

  const data = {
    loading: introspection_loading,
    types,
    queries,
    mutations,
  };

  return (
    <IntrospectionContext.Provider value={data}>
      {children}
    </IntrospectionContext.Provider>
  );
};

const useIntrospection = (): IntrospectionData => useContext(IntrospectionContext);

registerComponent("IntrospectionProvider", IntrospectionProvider);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default IntrospectionProvider;
registerHook("useIntrospection", useIntrospection);
