import { Meteor } from "meteor/meteor";
import _ from "lodash";
import { Accounts } from "meteor/accounts-base";
import {
  IntrospectionFragmentMatcher,
  InMemoryCache
} from "@apollo/client/cache";
import { ApolloClient, ApolloLink } from "@apollo/client";
import { BatchHttpLink } from "@apollo/client/link/batch-http";

const graphql_loc = Meteor?.settings.public?.graphql ?? "http://localhost:3000";
const introspect_schema = async () => {
  const result = await fetch(`${graphql_loc}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      variables: {},
      query: `
        {
          __schema {
            types {
              kind
              name
              possibleTypes {
                name
              }
            }
          }
        }
      `
    })
  });

  const result_json = await result.json();

  const possibleTypes = {};

  result_json.data.__schema.types.forEach((supertype) => {
    if (supertype.possibleTypes) {
      possibleTypes[supertype.name] = supertype.possibleTypes.map(
        (subtype) => subtype.name
      );
    }
  });

  return possibleTypes;
};

const apolloInit = async () => {
  const possibleTypes = await introspect_schema();
  const cache = new InMemoryCache({
    possibleTypes,
    typePolicies: {
      Query: {
        fields: {
          getProjects: {
            keyArgs: false,
            merge(existing, incoming, { args: { pageSize, pageNumber } }) {
              if (existing === undefined) {
                return incoming;
              }

              const { projects, ...other } = existing;

              const merged = projects ? projects.slice(0) : [];

              if (pageSize !== undefined && pageNumber !== undefined) {
                const offset = pageSize * pageNumber;
                for (
                  let i = offset;
                  i < offset + incoming.projects.length;
                  i++
                ) {
                  merged[i] = incoming.projects[i - offset];
                }
              }

              return { projects: merged, ...other };
            },

            read(existing, { args: { pageSize: _pageSize, pageNumber } }) {
              if (existing === undefined) {
                return;
              }

              if (_pageSize !== undefined && pageNumber !== undefined) {
                const pageSize =
                  _pageSize === -1 ? existing.totalCount : _pageSize;
                const offset = pageNumber * pageSize;
                const page = { ...existing };
                page.projects =
                  page.projects?.slice(offset, offset + pageSize) ?? [];

                // If there are spots on a page that aren't filled in, we need to fetch from the server instead of the cache
                if (
                  (page.projects.length < pageSize &&
                    page.projects.length + offset !== existing.totalCount) ||
                  _.some(page.projects, (project) => project === undefined)
                ) {
                  return undefined;
                }

                return page;
              }

              return existing;
            }
          }
        }
      }
    }
  });

  const auth_link = new ApolloLink((operation, forward) => {
    const token = Accounts._storedLoginToken();
    //console.log(`Sending request with auth: ${token}`, operation);

    if (token) {
      operation.setContext(() => ({
        headers: {
          authorization_token: token
        }
      }));
    }

    return forward(operation);
  });

  const batch_link = new BatchHttpLink();

  const apollo_client = new ApolloClient({
    cache,
    link: ApolloLink.from([auth_link, batch_link])
  });

  return apollo_client;
};

export default apolloInit;
