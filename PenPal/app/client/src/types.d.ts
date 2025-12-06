import React from "react";

// PenPal Types
export interface PenPalComponent {
  [key: string]: React.ComponentType<any>;
}

export interface PenPalHook {
  [key: string]: (...args: any[]) => any;
}

export interface PenPalRoute {
  [key: string]: any;
}

export interface PenPalBadge {
  [key: string]: any;
}

export interface PenPalUtils {
  [key: string]: any;
}

export interface PenPalTypes {
  [key: string]: any;
}

// TODO: Move this to the CoreAPI plugin
export interface PenPalProjectScopeButton {
  [key: string]: any;
}

export interface PenPalPluginManifest {
  name?: string;
  version?: string;
  dependsOn?: string[];
}

export interface PenPalPlugin {
  loadPlugin: () => Promise<{ registerRoutes?: () => void }>;
}

export interface PenPalRegisteredPlugin {
  name: string;
  version: string;
  dependsOn: string[];
  plugin: PenPalPlugin;
}

export interface PenPalLoadedPlugin {
  loaded: boolean;
  name: string;
  version: string;
}

declare global {
  interface ImportMeta {
    glob: (pattern: string, options: { eager: boolean }) => Record<string, any>;
  }
}
