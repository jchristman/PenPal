import { ApolloServer } from "@apollo/server";
import { GraphQLSchema } from "graphql";
import { PubSub } from "graphql-subscriptions";
import { Server as HttpServer } from "http";
import { WebSocketServer } from "ws";
import { PenPalInstance, GraphQLContext, WebSocketContext } from "./penpal";

// GraphQL Server types
export interface GraphQLServerConfig {
  plugins_types?: any;
  plugins_resolvers?: any[];
  plugins_buildLoaders?: () => Record<string, any>;
}

export interface GraphQLServerInstance {
  apolloServer: ApolloServer;
  httpServer: HttpServer;
  wsServer: WebSocketServer;
  pubsub: PubSub;
  schema: GraphQLSchema;
}

// Apollo Server context types
export interface ApolloServerContext extends GraphQLContext {
  req?: any; // Express request
}

export interface ApolloWebSocketContext extends WebSocketContext {
  connectionParams?: Record<string, any>;
  extra?: any;
}

// Server cleanup types
export interface ServerCleanup {
  dispose(): void;
}

// Error formatting types
export interface GraphQLErrorExtension {
  code?: string;
  stacktrace?: string[];
  [key: string]: any;
}

export interface FormattedGraphQLError {
  message: string;
  locations?: readonly any[];
  path?: readonly (string | number)[];
  extensions?: GraphQLErrorExtension;
}

// WebSocket event types - match graphql-ws library exactly
export interface WebSocketConnectionEvent {
  ctx: any;
  code?: number;
  reason?: string;
}

export interface WebSocketSubscriptionEvent {
  ctx: any;
  message: any; // graphql-ws SubscribeMessage
}

export interface WebSocketOperationEvent {
  ctx: any;
  message: any; // graphql-ws SubscribeMessage
}

export interface WebSocketErrorEvent {
  ctx: any;
  message: any; // graphql-ws ErrorMessage
  errors: readonly any[];
}

// Loader function types
export type BuildLoadersFunction = () => Record<string, any>;

// GraphQL schema loading types
export interface GraphQLFileResult {
  loadGraphQLFiles(): Promise<any>;
  resolvers: any[];
  buildLoaders: BuildLoadersFunction;
}
