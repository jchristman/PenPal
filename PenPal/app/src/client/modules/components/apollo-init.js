import _ from "lodash";
import { InMemoryCache } from "@apollo/client/cache";
import { ApolloClient, ApolloLink, split } from "@apollo/client";
import { BatchHttpLink } from "@apollo/client/link/batch-http";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { onError } from "@apollo/client/link/error";
import { createClient } from "graphql-ws";

const graphql_loc = "http://localhost:3001";

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 10,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 1.5,
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const introspect_schema = async (retryCount = 0) => {
  try {
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
        `,
      }),
    });

    if (!result.ok) {
      throw new Error(`HTTP ${result.status}: ${result.statusText}`);
    }

    const result_json = await result.json();

    if (result_json.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result_json.errors)}`);
    }

    const possibleTypes = {};

    result_json.data.__schema.types.forEach((supertype) => {
      if (supertype.possibleTypes) {
        possibleTypes[supertype.name] = supertype.possibleTypes.map(
          (subtype) => subtype.name
        );
      }
    });

    console.log("✅ Schema introspection successful");
    return possibleTypes;
  } catch (error) {
    console.warn(
      `⚠️ Schema introspection failed (attempt ${retryCount + 1}/${
        RETRY_CONFIG.maxRetries
      }):`,
      error.message
    );

    if (retryCount < RETRY_CONFIG.maxRetries - 1) {
      const delay = Math.min(
        RETRY_CONFIG.initialDelay *
          Math.pow(RETRY_CONFIG.backoffMultiplier, retryCount),
        RETRY_CONFIG.maxDelay
      );
      console.log(`🔄 Retrying schema introspection in ${delay}ms...`);
      await sleep(delay);
      return introspect_schema(retryCount + 1);
    } else {
      console.error("❌ Schema introspection failed after all retries");
      throw error;
    }
  }
};

const apolloInit = async (onProgress) => {
  try {
    onProgress?.("Connecting to GraphQL server...");
    const possibleTypes = await introspect_schema();

    onProgress?.("Setting up Apollo Client cache...");
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
              },
            },
          },
        },
      },
    });

    onProgress?.("Setting up authentication...");
    const auth_link = new ApolloLink((operation, forward) => {
      //const token = Accounts._storedLoginToken();
      //console.log(`Sending request with auth: ${token}`, operation);

      //if (token) {
      //  operation.setContext(() => ({
      //    headers: {
      //      authorization_token: token
      //    }
      //  }));
      //}

      return forward(operation);
    });

    onProgress?.("Setting up HTTP connection...");
    const batch_link = new BatchHttpLink({
      uri: `${graphql_loc}/graphql`,
    });

    // Error link to catch and log all errors with detailed information
    const errorLink = onError(
      ({ graphQLErrors, networkError, operation, forward }) => {
        if (graphQLErrors) {
          graphQLErrors.forEach(({ message, locations, path }) => {
            console.error(`GraphQL error: ${message}`, { locations, path });
          });
        }

        if (networkError) {
          console.error("Network error:", networkError.message);
        }
      }
    );

    onProgress?.("Setting up WebSocket connection...");
    // Create WebSocket link for subscriptions
    const wsLink = new GraphQLWsLink(
      createClient({
        url: "ws://localhost:3001/graphql",
        onError: (error) => {
          console.error("GraphQL WebSocket Error:", error.message);
        },
        onClosed: (event) => {
          console.warn(
            "WebSocket connection closed:",
            event.code,
            event.reason
          );
        },
      })
    );

    onProgress?.("Finalizing Apollo Client setup...");
    // Split links: WebSocket for subscriptions, HTTP for queries and mutations
    const splitLink = split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === "OperationDefinition" &&
          definition.operation === "subscription"
        );
      },
      ApolloLink.from([errorLink, wsLink]),
      ApolloLink.from([errorLink, auth_link, batch_link])
    );

    const apollo_client = new ApolloClient({
      cache,
      link: splitLink,
    });

    console.log("✅ Apollo Client initialized successfully");
    return apollo_client;
  } catch (error) {
    console.error("❌ Failed to initialize Apollo Client:", error);
    throw error;
  }
};

export default apolloInit;
