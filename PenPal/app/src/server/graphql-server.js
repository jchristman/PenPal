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

// Initialize logger for the GraphQL server
const logger = PenPal.Utils.BuildLogger("PenPal");

const startGraphQLServer = async (
  plugins_types = {},
  plugins_resolvers = {},
  plugins_buildLoaders = () => null
) => {
  logger.log("Loading GraphQL Files...");
  const types = await loadGraphQLFiles();
  const _resolvers = _.merge(resolvers, plugins_resolvers);
  const _typeDefs = mergeTypeDefs([types, plugins_types]);

  // Create PubSub instance for subscriptions
  const pubsub = new PubSub();

  // Make PubSub available globally for plugins
  PenPal.PubSub = pubsub;

  const schema = makeExecutableSchema({
    typeDefs: _typeDefs,
    resolvers: _resolvers,
    inheritResolversFromInterfaces: true,
  });

  const server = new ApolloServer({
    schema,
    allowBatchedHttpRequests: true,
    introspection: true,
    formatError: (err) => {
      logger.error(
        `${err.extensions?.code ?? "Unknown Error"} ::: ${err.message}`
      );
      logger.error(err.extensions?.stacktrace.join("\n"));
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
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        let loaders = {};

        loaders = _.extend(loaders, buildLoaders());
        loaders = _.extend(loaders, plugins_buildLoaders());

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
  const serverCleanup = useServer(
    {
      schema,
      context: async (ctx, msg, args) => {
        let loaders = {};
        loaders = _.extend(loaders, buildLoaders());
        loaders = _.extend(loaders, plugins_buildLoaders());

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
      onConnect: (ctx) => {
        logger.log("🔗 WebSocket client connected");
      },
      onDisconnect: (ctx, code, reason) => {
        logger.log("❌ WebSocket client disconnected");
      },
      onSubscribe: (ctx, msg) => {
        // logger.log("📡 New subscription:", {
        //   id: msg.id,
        //   operationName: msg.payload?.operationName,
        //   query: msg.payload?.query?.substring(0, 100) + "...",
        // });
      },
      onComplete: (ctx, msg) => {
        // logger.log("⚡ Operation executed:", {
        //   id: msg.id,
        //   operationName: msg.payload?.operationName,
        //   hasErrors: false,
        // });
      },
      onError: (ctx, msg, errors) => {
        logger.error("❌ GraphQL WebSocket Error:", {
          id: msg.id,
          operationName: msg.payload?.operationName,
          errors: errors.map((e) => e.message),
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
