import { PubSub } from "graphql-subscriptions";
import { GraphQLSchema } from "graphql";

// Core PenPal type definitions
// Import plugin types
import type {
  RegisteredPlugin,
  LoadedPlugin,
  PluginModule,
  PluginLoaderResult,
} from "./plugins";

export interface PenPalInstance {
  Constants: PenPalConstants;
  RegisteredPlugins: Record<string, RegisteredPlugin>;
  LoadedPlugins: Record<string, LoadedPlugin>;
  Utils: PenPalUtils;

  // Core methods
  init(): Promise<void>;
  registerPlugin(manifest: any, plugin: PluginModule): void;
  loadPlugins(): Promise<PluginLoaderResult>;
  runStartupHooks(): Promise<void>;

  // Plugin-added properties (will be added as plugins are converted)
  // API?: PenPalAPI;
  // PubSub?: PubSub;
  // GraphQL?: { schema: GraphQLSchema };
  // Jobs?: any;
  // Docker?: any;
  // MQTT?: any;
  // DataStore?: any;
  [key: string]: any; // Allow plugins to add properties dynamically
}

export interface PenPalConstants {
  TMP_DIR?: string;
  Role: {
    Admin: string;
    User: string;
  };
}

// Utility types
export interface PenPalUtils {
  Epoch(): number;
  Sleep(ms: number): Promise<void>;
  AsyncNOOP(): Promise<void>;
  AwaitTimeout<T>(awaitFunction: () => Promise<T>, timeout: number): Promise<T>;
  LoadGraphQLDirectories(rootDir: string): Promise<any>;
  MkdirP(directory: string): void;
  RunAfterImport(fn: () => void): void;
  isFunction(obj: any): boolean;
  BatchFunction<T extends any[], R>(
    handler: (batchedArgs: T[]) => R | Promise<R>,
    timeoutMs: number
  ): (...args: T) => void;
  BuildLogger(pluginName: string): Logger;
  Logger: LoggerBuilder;
}

export interface Logger {
  log(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
  info(...args: any[]): void;
  debug(...args: any[]): void;
}

export interface LoggerBuilder {
  BuildLogger(pluginName: string): Logger;
}

// API types
export interface PenPalAPI {
  CachingAPI?: () => any;
  Services?: any; // TODO: Define Services API types
  Hosts?: any; // TODO: Define Hosts API types
  Networks?: any; // TODO: Define Networks API types
  Projects?: any; // TODO: Define Projects API types
}

// GraphQL context types
export interface GraphQLContext {
  loaders?: Record<string, any>;
  PenPalCachingAPI?: any;
  pubsub?: PubSub;
  user?: any; // TODO: Define user type
}

// WebSocket context types
export interface WebSocketContext {
  loaders?: Record<string, any>;
  PenPalCachingAPI?: any;
  pubsub?: PubSub;
}

// Plugin loader types

// Error types
export class PenPalError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = "PenPalError";
  }
}
