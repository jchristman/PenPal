import React from 'react';

// PenPal Global Object Types
interface PenPalComponents {
  [key: string]: React.ComponentType<any>;
}

interface PenPalHooks {
  [key: string]: (...args: any[]) => any;
}

interface PenPalRoutes {
  [key: string]: any;
}

interface PenPalBadges {
  [key: string]: any;
}

interface PenPalProjectScopeButtons {
  [key: string]: any;
}

interface PenPalUtils {
  [key: string]: any;
}

interface PenPalPluginManifest {
  name?: string;
  version?: string;
  dependsOn?: string[];
}

interface PenPalPlugin {
  loadPlugin: () => Promise<{ registerRoutes?: () => void }>;
}

interface PenPalRegisteredPlugin {
  name: string;
  version: string;
  dependsOn: string[];
  plugin: PenPalPlugin;
}

interface PenPalLoadedPlugin {
  loaded: boolean;
  name: string;
  version: string;
}

declare global {
  var PenPal: {
    Components: PenPalComponents;
    Hooks: PenPalHooks;
    Routes: PenPalRoutes;
    Badges: PenPalBadges;
    ProjectScopeButtons: PenPalProjectScopeButtons;
    Utils: PenPalUtils;
    Regex: Record<string, RegExp>;
    GraphQL: {
      Utils: any;
    };
    RegisteredPlugins: Record<string, PenPalRegisteredPlugin>;
    LoadedPlugins: Record<string, PenPalLoadedPlugin>;
    registerComponent: (name: string, component: React.ComponentType<any>) => void;
    registerHook: (name: string, hook: (...args: any[]) => any) => void;
    registerRoute: (options: any, index?: number) => void;
    registerBadge: (badge: any) => void;
    registerProjectScopeButton: (buttonConfig: any) => void;
    getRoute: (routeName: string) => any;
    registerUtil: (name: string, util: any) => void;
    registerPlugin: (manifest: PenPalPluginManifest, plugin: PenPalPlugin) => void;
    loadPlugins: () => Promise<void>;
  };

  // ImportMeta types for Vite
  interface ImportMeta {
    glob: (pattern: string, options?: { eager?: boolean }) => Record<string, any>;
  }

  // Prism global
  const Prism: {
    plugins: {
      NormalizeWhitespace: {
        setDefaults: (defaults: any) => void;
      };
    };
    highlightAll: () => void;
  };

  // Apollo init function
  function apolloInit(onProgress?: (status: string) => void): Promise<any>;
}
