import _ from "lodash";
import { InMemoryCache } from "@apollo/client/cache";
import { ApolloClient, ApolloLink, split } from "@apollo/client";
import { BatchHttpLink } from "@apollo/client/link/batch-http";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { onError } from "@apollo/client/link/error";
import { createClient } from "graphql-ws";
import {
  setWebSocketState,
  WS_CONNECTION_STATES,
} from "./common/websocket-utils.js";

const graphql_loc = "http://localhost:3001";

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 10,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 1.5,
};

// WebSocket reconnection configuration
const WS_RETRY_CONFIG = {
  maxRetries: 15,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 1.5,
  shouldRetry: (errorOrCloseEvent) => {
    // Don't retry for authentication failures or intentional closures
    if (errorOrCloseEvent?.code === 1000 || errorOrCloseEvent?.code === 4401) {
      return false;
    }
    return true;
  },
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
    // Create WebSocket link for subscriptions with automatic reconnection
    const wsLink = new GraphQLWsLink(
      createClient({
        url: "ws://localhost:3001/graphql",
        retryAttempts: WS_RETRY_CONFIG.maxRetries,
        retryWait: async function (retries) {
          const delay = Math.min(
            WS_RETRY_CONFIG.initialDelay *
              Math.pow(WS_RETRY_CONFIG.backoffMultiplier, retries),
            WS_RETRY_CONFIG.maxDelay
          );
          console.log(
            `🔄 WebSocket reconnection attempt ${retries + 1}/${
              WS_RETRY_CONFIG.maxRetries
            } in ${delay}ms...`
          );

          // Update state to indicate we're actively reconnecting
          setWebSocketState(WS_CONNECTION_STATES.RECONNECTING);

          await sleep(delay);
        },
        shouldRetry: WS_RETRY_CONFIG.shouldRetry,
        connectionParams: () => {
          // Add any authentication headers here if needed
          return {
            // authorization: getAuthToken(),
          };
        },
        on: {
          connecting: () => {
            console.log("🔌 WebSocket connecting...");
            setWebSocketState(WS_CONNECTION_STATES.CONNECTING);
          },
          connected: (socket, payload) => {
            console.log("✅ WebSocket connected successfully");
            setWebSocketState(WS_CONNECTION_STATES.CONNECTED);
          },
          message: ({ type, payload }) => {
            if (type === "connection_ack") {
              console.log("🤝 WebSocket connection acknowledged");
            }
          },
          error: (error) => {
            console.error("❌ GraphQL WebSocket Error:", error.message);
            // Log additional error details for debugging
            if (error.code) {
              console.error(`WebSocket error code: ${error.code}`);
            }
            if (error.reason) {
              console.error(`WebSocket error reason: ${error.reason}`);
            }

            // Update connection state based on error
            if (error.code === 4401) {
              setWebSocketState(WS_CONNECTION_STATES.FAILED);
            }
          },
          closed: (event) => {
            console.warn(
              `❌ WebSocket connection closed (code: ${event.code}, reason: "${event.reason}")`
            );

            // Update connection state based on close reason
            let newState = WS_CONNECTION_STATES.DISCONNECTED;

            // Provide user-friendly error messages
            switch (event.code) {
              case 1000:
                console.log("🔌 WebSocket closed normally");
                newState = WS_CONNECTION_STATES.DISCONNECTED;
                break;
              case 1001:
                console.warn("🔌 WebSocket closed - going away");
                newState = WS_CONNECTION_STATES.DISCONNECTED;
                break;
              case 1006:
                console.warn(
                  "🔌 WebSocket closed abnormally - will attempt to reconnect"
                );
                newState = WS_CONNECTION_STATES.RECONNECTING;
                break;
              case 4400:
                console.error("🔌 WebSocket closed - bad request");
                newState = WS_CONNECTION_STATES.FAILED;
                break;
              case 4401:
                console.error("🔌 WebSocket closed - unauthorized");
                newState = WS_CONNECTION_STATES.FAILED;
                break;
              case 4500:
                console.error("🔌 WebSocket closed - internal server error");
                newState = WS_CONNECTION_STATES.RECONNECTING;
                break;
              default:
                console.warn(
                  `🔌 WebSocket closed with unknown code: ${event.code}`
                );
                newState = WS_CONNECTION_STATES.RECONNECTING;
            }

            setWebSocketState(newState);
          },
        },
        // Keep connection alive with periodic pings
        keepAlive: 30000, // 30 seconds
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
