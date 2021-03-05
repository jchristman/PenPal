import React, { createContext, useContext, useState, useEffect } from "react";
import { Components, registerComponent, registerHook } from "meteor/penpal";
import { useQuery } from "@apollo/client";

import IntrospectionQuery from "./introspection-provider-gql.js";

const IntrospectionContext = createContext({});
const IntrospectionProvider = ({ children }) => {
  const {
    loading: introspection_loading,
    error: introspection_error,
    data: { __schema } = {}
  } = useQuery(IntrospectionQuery);

  let types = {},
    queries = {},
    mutations = {};
  if (!introspection_loading) {
    for (let type of __schema?.types ?? []) {
      types[type.name] = type;
    }
    for (let query of __schema?.queryType?.fields ?? []) {
      queries[query.name] = query;
    }
    for (let mutation of __schema?.mutationType?.fields ?? []) {
      mutations[mutation.name] = mutation;
    }
  }

  const data = {
    loading: introspection_loading,
    types,
    queries,
    mutations
  };

  return (
    <IntrospectionContext.Provider value={data}>
      {children}
    </IntrospectionContext.Provider>
  );
};

const useIntrospection = () => useContext(IntrospectionContext);

registerComponent("IntrospectionProvider", IntrospectionProvider);
registerHook("useIntrospection", useIntrospection);
