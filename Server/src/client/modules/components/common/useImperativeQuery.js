import React from "react";
import { registerHook } from "meteor/penpal";
import { useApolloClient } from "@apollo/client";

const useImperativeQuery = (query) => {
  const client = useApolloClient();

  const imperativelyCallQuery = async (variables) => {
    return await client.query({ query, variables });
  };

  return imperativelyCallQuery;
};

registerHook("useImperativeQuery", useImperativeQuery);
