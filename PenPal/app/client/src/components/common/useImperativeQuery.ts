import React from "react";
import { registerHook } from "@penpal/core";
import { useApolloClient, DocumentNode } from "@apollo/client";

const useImperativeQuery = (query: DocumentNode) => {
  const client = useApolloClient();

  const imperativelyCallQuery = async (variables?: Record<string, any>) => {
    return await client.query({ query, variables });
  };

  return imperativelyCallQuery;
};

registerHook("useImperativeQuery", useImperativeQuery);
