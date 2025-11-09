import PenPal from "#penpal/core";

const PLUGIN_NAME = "Base";
const STORE = "Profiles";

const nowIso = () => new Date().toISOString();

let profilesStoreReady = false;
const ensureStore = async () => {
  if (profilesStoreReady) return true;
  try {
    // Idempotent: CreateStore will ensure the collection exists across adapters
    await PenPal.DataStore.CreateStore(PLUGIN_NAME, STORE);
    profilesStoreReady = true;
    return true;
  } catch (e) {
    // If adapters are not ready yet, DataStore.CreateStore internally waits; any other error bubbles
    throw e;
  }
};

const listProfiles = async () => {
  await ensureStore();
  return (await PenPal.DataStore.fetch(PLUGIN_NAME, STORE, {})) ?? [];
};

const getProfile = async (id) => {
  await ensureStore();
  return (await PenPal.DataStore.fetchOne(PLUGIN_NAME, STORE, { id })) || null;
};

const insertProfile = async (profile) => {
  await ensureStore();
  const withMeta = {
    ...profile,
    created_at: profile.created_at || nowIso(),
    updated_at: profile.updated_at || nowIso(),
  };
  const inserted = await PenPal.DataStore.insert(PLUGIN_NAME, STORE, withMeta);
  const insertedId =
    typeof inserted === "string" ? inserted : inserted?.id || null;
  // Always return the stored document from DB to satisfy non-nullable fields
  return insertedId ? await getProfile(insertedId) : inserted;
};

const updateProfile = async (id, updates) => {
  const existing = await getProfile(id);
  if (!existing) throw new Error("[404] Profile not found");
  const merged = {
    ...existing,
    ...updates,
    updated_at: nowIso(),
  };
  await PenPal.DataStore.updateOne(PLUGIN_NAME, STORE, { id }, merged);
  return await getProfile(id);
};

const deleteProfile = async (id) => {
  await PenPal.DataStore.delete(PLUGIN_NAME, STORE, { id });
  return true;
};

export default {
  async getPluginProfiles() {
    return await listProfiles();
  },

  async getPluginProfile(parent, { id }) {
    return await getProfile(id);
  },
};

export const mutations = {
  async createPluginProfile(parent, { input }) {
    const profile = {
      name: input.name,
      description: input.description || null,
      plugin_configs: [],
    };
    return await insertProfile(profile);
  },

  async updatePluginProfile(parent, { id, input }) {
    const updates = {};
    if (typeof input.name === "string") updates.name = input.name;
    if (typeof input.description === "string")
      updates.description = input.description;
    if (Array.isArray(input.plugin_configs))
      updates.plugin_configs = input.plugin_configs;
    return await updateProfile(id, updates);
  },

  async deletePluginProfile(parent, { id }) {
    return await deleteProfile(id);
  },

  async upsertPluginConfigInProfile(
    parent,
    { profile_id, plugin_id, configuration }
  ) {
    const existing = await getProfile(profile_id);
    if (!existing) throw new Error("[404] Profile not found");
    const filtered = (existing.plugin_configs || []).filter(
      (pc) => pc.plugin_id !== plugin_id
    );
    filtered.push({ plugin_id, configuration });
    return await updateProfile(profile_id, { plugin_configs: filtered });
  },

  async removePluginConfigFromProfile(parent, { profile_id, plugin_id }) {
    const existing = await getProfile(profile_id);
    if (!existing) throw new Error("[404] Profile not found");
    const filtered = (existing.plugin_configs || []).filter(
      (pc) => pc.plugin_id !== plugin_id
    );
    return await updateProfile(profile_id, { plugin_configs: filtered });
  },

  // Export a profile as JSON (suitable for saving to a file by the client)
  async exportPluginProfile(parent, { id }) {
    const existing = await getProfile(id);
    if (!existing) throw new Error("[404] Profile not found");

    // Build a complete plugin_configs list covering all configurable plugins
    const existingMap = new Map(
      (existing.plugin_configs || []).map((pc) => [
        pc.plugin_id,
        pc.configuration,
      ])
    );

    const allConfigurablePluginIds = Object.keys(PenPal.LoadedPlugins).filter(
      (pid) => !!PenPal.LoadedPlugins[pid]?.settings?.configuration
    );

    const fullPluginConfigs = [];
    for (const plugin_id of allConfigurablePluginIds) {
      if (existingMap.has(plugin_id)) {
        fullPluginConfigs.push({
          plugin_id,
          configuration: existingMap.get(plugin_id),
        });
        continue;
      }
      // Fallback to current persisted configuration in the plugin's Configuration store
      try {
        const pluginName = PenPal.LoadedPlugins[plugin_id].name;
        const persisted = await PenPal.DataStore.fetch(
          pluginName,
          "Configuration",
          {}
        );
        const persistedFirst = Array.isArray(persisted) ? persisted[0] : null;
        fullPluginConfigs.push({
          plugin_id,
          configuration: persistedFirst || null,
        });
      } catch (e) {
        fullPluginConfigs.push({ plugin_id, configuration: null });
      }
    }

    // Return clean object without __typename clutter
    const { __typename, plugin_configs, ...rest } = existing;
    return { ...rest, plugin_configs: fullPluginConfigs };
  },

  // Import a profile from JSON payload
  // If overwrite=false (default), create a new profile with a new id/name (appending timestamp if duplicate name)
  // If overwrite=true and payload.id exists and matches an existing profile, update it
  async importPluginProfile(parent, { profile, overwrite = false }) {
    await ensureStore();
    const input = typeof profile === "string" ? JSON.parse(profile) : profile;

    // Normalize payload
    const {
      id: payloadId = null,
      name,
      description = null,
      plugin_configs = [],
      ...rest
    } = input || {};

    if (!name || typeof name !== "string") {
      throw new Error("[400] Profile import requires a non-empty name");
    }

    if (overwrite && payloadId) {
      const existing = await getProfile(payloadId);
      if (existing) {
        return await updateProfile(payloadId, {
          name,
          description,
          plugin_configs,
          ...rest,
        });
      }
    }

    // If not overwriting, or id not found, create a new profile
    // Avoid name collision by appending a timestamp if a profile with same name exists
    const all = await listProfiles();
    const collision = all.find((p) => p.name === name);
    const finalName = collision ? `${name} (${nowIso()})` : name;

    return await insertProfile({
      name: finalName,
      description,
      plugin_configs,
      ...rest,
    });
  },
};
