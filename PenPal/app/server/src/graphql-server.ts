import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { mergeTypeDefs } from "@graphql-tools/merge";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { useServer } from "graphql-ws/lib/use/ws";
import { WebSocketServer } from "ws";
import { PubSub } from "graphql-subscriptions";
import express from "express";
import { createServer } from "http";
import cors from "cors";

import PenPal from "#penpal/core";
import _ from "lodash";

import { loadGraphQLFiles, resolvers, buildLoaders } from "./graphql/index.js";
import type {
  GraphQLServerConfig,
  ApolloServerContext,
  ApolloWebSocketContext,
  WebSocketConnectionEvent,
  WebSocketSubscriptionEvent,
  WebSocketOperationEvent,
  WebSocketErrorEvent,
  ServerCleanup,
  FormattedGraphQLError,
  GraphQLErrorExtension
} from "./types/graphql";
import type { Logger } from "./types/penpal";

// Initialize logger for the GraphQL server
const logger: Logger = PenPal.Utils.BuildLogger("PenPal");

const startGraphQLServer = async (
  plugins_types: any = {},
  plugins_resolvers: any[] = [],
  plugins_buildLoaders: (() => any) | null = () => null
): Promise<void> => {
  logger.log("Loading GraphQL Files...");
  const types = await loadGraphQLFiles();
  const _resolvers = _.merge(resolvers, plugins_resolvers);
  const _typeDefs = mergeTypeDefs([types, plugins_types]);

  // Create PubSub instance for subscriptions
  const pubsub = new PubSub();

  // Make PubSub available globally for plugins
  PenPal.PubSub = pubsub;

  let schema = makeExecutableSchema({
    typeDefs: _typeDefs,
    resolvers: _resolvers,
    inheritResolversFromInterfaces: true,
  });

  PenPal.GraphQL = {
    schema,
  };

  const server = new ApolloServer({
    schema,
    allowBatchedHttpRequests: true,
    introspection: true,
    formatError: (err: any): FormattedGraphQLError => {
      const errorCode = err.extensions?.code ?? "Unknown Error";
      logger.error(`${errorCode} ::: ${err.message}`);

      // Log path information for subscription errors
      if (err.path) {
        logger.error(`Error path: ${err.path.join(" -> ")}`);
      }

      // Log stack trace if available
      if (err.extensions?.stacktrace) {
        logger.error("Stack trace:");
        logger.error(err.extensions.stacktrace.join("\n"));
      } else if (err.stack) {
        logger.error("Stack trace:");
        logger.error(err.stack);
      }

      // Log additional context for subscription errors
      if (err.source && err.source.body) {
        logger.error(
          "GraphQL query/subscription:",
          err.source.body.substring(0, 200) + "..."
        );
      }

      return err;
    },
  });

  // Create Express app and HTTP server
  const app = express();
  const httpServer = createServer(app);

  // Create WebSocket server for subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql",
  });

  await server.start();

  // Setup Express middleware
  app.use(
    "/graphql",
    cors<cors.CorsRequest>(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }): Promise<ApolloServerContext> => {
        let loaders: Record<string, any> = {};

        loaders = _.extend(loaders, buildLoaders());
        loaders = _.extend(loaders, plugins_buildLoaders ? plugins_buildLoaders() : {});

        //const user = await getUser(req.headers.authorization_token);
        //if (user !== undefined) {
        //  user.id = user._id;
        //  await loaders.webappUsersLoader.prime(user.id, user);
        //}

        // FIXME: Ensure API is loaded before accessing CachingAPI
        const PenPalCachingAPI =
          PenPal.API && PenPal.API.CachingAPI ? PenPal.API.CachingAPI() : {};
        if (!PenPal.API || !PenPal.API.CachingAPI) {
          logger.warn(
            "PenPal.API.CachingAPI not available yet, using empty fallback"
          );
        }

        return {
          //user: user,
          loaders,
          PenPalCachingAPI,
          pubsub,
        };
      },
    })
  );

  // Setup WebSocket server for GraphQL subscriptions
  const serverCleanup: ServerCleanup = useServer(
    {
      schema,
      context: async (ctx: any, msg: any, args: any): Promise<ApolloWebSocketContext> => {
        let loaders: Record<string, any> = {};
        loaders = _.extend(loaders, buildLoaders());
        loaders = _.extend(loaders, plugins_buildLoaders ? plugins_buildLoaders() : {});

        const PenPalCachingAPI =
          PenPal.API && PenPal.API.CachingAPI ? PenPal.API.CachingAPI() : {};

        if (!PenPal.API || !PenPal.API.CachingAPI) {
          logger.warn(
            "PenPal.API.CachingAPI not available yet in WebSocket context, using empty fallback"
          );
        }

        return {
          loaders,
          PenPalCachingAPI,
          pubsub,
        };
      },
      onConnect: () => {
        logger.log("🔗 WebSocket client connected");
      },
      onDisconnect: (ctx: any, code?: number, reason?: string) => {
        logger.log("❌ WebSocket client disconnected");
      },
      onSubscribe: (ctx: WebSocketSubscriptionEvent['ctx'], message: WebSocketSubscriptionEvent['message']) => {
        // logger.log("📡 New subscription:", {
        //   id: msg.id,
        //   operationName: msg.payload?.operationName,
        //   query: msg.payload?.query?.substring(0, 100) + "...",
        // });
      },
      onComplete: (ctx: WebSocketOperationEvent['ctx'], message: WebSocketOperationEvent['message']) => {
        // logger.log("⚡ Operation executed:", {
        //   id: msg.id,
        //   operationName: msg.payload?.operationName,
        //   hasErrors: false,
        // });
      },
      onError: (ctx: WebSocketErrorEvent['ctx'], message: WebSocketErrorEvent['message'], errors: WebSocketErrorEvent['errors']) => {
        logger.error("❌ GraphQL WebSocket Error:", {
          id: message.id,
          operationName: message.payload?.operationName,
          errors: errors.map((e: any) => ({
            message: e.message,
            path: e.path,
            extensions: e.extensions,
          })),
        });

        // Log the full error details for debugging
        errors.forEach((error: any, index: number) => {
          logger.error(`WebSocket Error ${index + 1}:`, {
            message: error.message,
            path: error.path,
            locations: error.locations,
            extensions: error.extensions,
            stack: error.stack,
          });
        });
      },
    },
    wsServer
  );

  // Start the HTTP server
  const port = 3001;
  httpServer.listen(port, () => {
    logger.log(`GraphQL Server is running at http://localhost:${port}/graphql`);
    logger.log(
      `GraphQL Subscriptions (WebSocket) available at ws://localhost:${port}/graphql`
    );
  });

  // Cleanup function for graceful shutdown
  process.on("SIGTERM", () => {
    serverCleanup.dispose();
    httpServer.close();
  });
};

export default startGraphQLServer;
