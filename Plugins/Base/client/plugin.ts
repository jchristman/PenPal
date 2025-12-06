import type { PenPalPlugin } from "@penpal/types";
import PenPal from "@penpal/core";
import.meta.glob("./**/*.{jsx,tsx}", { eager: true });
import registerRoutes from "./routes.ts";

// Import profile GraphQL operations
import GetProfiles from "./pages/configuration/queries/get-profiles.ts";
import {
  CreateProfile,
  UpdateProfile,
  DeleteProfile,
  UpsertPluginConfigInProfile,
  RemovePluginConfigFromProfile,
  ExportPluginProfile,
  ImportPluginProfile,
} from "./pages/configuration/queries/profile-mutations.ts";

// Initialize PenPal.Profiles API
if (!PenPal.Profiles) {
  PenPal.Profiles = {
    GetProfiles,
    CreateProfile,
    UpdateProfile,
    DeleteProfile,
    UpsertPluginConfigInProfile,
    RemovePluginConfigFromProfile,
    ExportPluginProfile,
    ImportPluginProfile,
  };
}

const BasePlugin: PenPalPlugin = {
  async loadPlugin(): Promise<{ registerRoutes?: () => void }> {
    return { registerRoutes };
  },
};

export default BasePlugin;
