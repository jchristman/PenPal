// Plugin system type definitions

// Plugin Manifest Types
export interface PluginManifest {
  name: string;
  version: string;
  load?: boolean;
  dependsOn?: string[];
  requiresImplementation?: boolean;
  implements?: string;
}

// Plugin Module Types
export interface PluginModule {
  loadPlugin(): Promise<PluginLoadResult>;
}

// Plugin Load Result Types
export interface PluginLoadResult {
  graphql?: PluginGraphQLResult;
  settings?: PluginSettings;
  hooks?: PluginHooks;
  jobs?: PluginJobs;
}

export interface PluginGraphQLResult {
  types?: any;
  resolvers?: any[];
  loaders?: Record<string, any>;
}

export interface PluginSettings {
  configuration?: PluginConfiguration;
  dashboard?: PluginDashboard;
  datastores?: PluginDataStore[];
  docker?: PluginDockerSettings;
  [key: string]: any; // Allow plugin-specific settings
}

export interface PluginConfiguration {
  schema_root: string;
  getter: string;
  setter: string;
}

export interface PluginDashboard {
  schema_root: string;
  getter: string;
}

export interface PluginDataStore {
  name: string;
  [key: string]: any;
}

export interface PluginDockerSettings {
  name: string;
  image?: string;
  dockercontext?: string;
}

export interface PluginHooks {
  postload?: (pluginName: string) => void | Promise<void>;
  settings?: Record<string, (settings: any) => boolean>;
  startup?: () => void | Promise<void>;
}

export interface PluginJobs {
  [jobName: string]: any;
}

// Plugin Registration Types
export interface RegisteredPlugin {
  dependsOn: string[];
  requiresImplementation: boolean;
  name: string;
  version: string;
  plugin: PluginModule;
  implements: string;
}

export interface LoadedPlugin {
  loaded: boolean;
  name: string;
  version: string;
  settings?: any;
  jobs?: any;
  startupHook?: () => void | Promise<void>;
}

// Plugin Loader Types
export interface PluginLoaderResult {
  plugins_types?: any;
  plugins_resolvers?: any[];
  plugins_buildLoaders?: () => Record<string, any>;
}

// Plugin API Types
export interface PluginAPI {
  [key: string]: any;
}

// Plugin Loading Context Types
export interface PluginLoadingContext {
  logger: any;
  PenPal: any;
  [key: string]: any;
}

// Plugin Validation Types
export interface PluginValidationResult {
  valid: boolean;
  errors?: string[];
}

// Plugin Dependency Resolution Types
export interface DependencyGraph {
  [pluginName: string]: {
    dependencies: string[];
    dependents: string[];
  };
}

export interface PluginResolutionOrder {
  loadOrder: string[];
  circularDependencies?: string[][];
}

// Plugin Event Types
export interface PluginLifecycleEvent {
  pluginName: string;
  event: "loading" | "loaded" | "failed" | "unloading" | "unloaded";
  error?: Error;
  timestamp: number;
}

// Plugin Extension Points
export interface PluginExtensionPoint {
  name: string;
  type: "graphql" | "api" | "middleware" | "lifecycle";
  handler: (...args: any[]) => any;
}

// Plugin Metadata Types
export interface PluginMetadata {
  name: string;
  version: string;
  description?: string;
  author?: string;
  license?: string;
  repository?: string;
  homepage?: string;
  keywords?: string[];
  engines?: Record<string, string>;
}

// Plugin Development Types
export interface PluginDevelopmentConfig {
  sourceDir: string;
  buildDir: string;
  testDir: string;
  docsDir: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

// Plugin Testing Types
export interface PluginTestConfig {
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
  mocks?: Record<string, any>;
  fixtures?: Record<string, any>;
}

// Plugin Documentation Types
export interface PluginDocumentation {
  readme?: string;
  apiDocs?: string;
  changelog?: string;
  examples?: string[];
}

// Complete Plugin Definition Type
export interface CompletePluginDefinition extends PluginModule {
  manifest: PluginManifest;
  metadata?: PluginMetadata;
  development?: PluginDevelopmentConfig;
  testing?: PluginTestConfig;
  documentation?: PluginDocumentation;
}

// Plugin Registry Types
export interface PluginRegistry {
  register(plugin: CompletePluginDefinition): void;
  unregister(pluginName: string): void;
  get(pluginName: string): CompletePluginDefinition | undefined;
  list(): CompletePluginDefinition[];
  isRegistered(pluginName: string): boolean;
}

// Plugin Loader Interface
export interface PluginLoader {
  load(pluginName: string): Promise<PluginLoadResult>;
  unload(pluginName: string): Promise<void>;
  reload(pluginName: string): Promise<PluginLoadResult>;
  getLoadedPlugins(): string[];
  isLoaded(pluginName: string): boolean;
}

// Type declarations for the plugins loader
export interface PluginsLoader {
  registerPlugins: () => Promise<void>;
}
