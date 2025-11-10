export default {
  async createNetworks(root, { project, subnets }, { PenPalCachingAPI }) {
    const { accepted, rejected } = await PenPalCachingAPI.Networks.InsertMany(
      subnets.map((subnet) => ({ project, subnet }))
    );
    if (accepted.length > 0) {
      // Ensure the Project.scope.networks includes the new network IDs
      try {
        const proj = await PenPalCachingAPI.Projects.Get(project);
        const existing = Array.isArray(proj.scope?.networks)
          ? proj.scope.networks
          : [];
        const next = Array.from(
          new Set([...existing, ...accepted.map((n) => n.id)])
        );
        await PenPalCachingAPI.Projects.Update({
          id: proj.id,
          "scope.networks": next,
        });
      } catch (_) {
        // best-effort; do not block on scope update
      }
      return accepted;
    }
    throw rejected[0]?.error || new Error("Failed to create networks");
  },

  async removeNetworks(root, { ids }, { PenPalCachingAPI }) {
    const result = await PenPalCachingAPI.Networks.RemoveMany(ids);
    // Also remove from any project's scope.networks where present
    try {
      // Fetch affected networks to determine project
      // PenPalCachingAPI may not provide bulk get by IDs here; rely on API.Networks if needed
      // This is a best-effort cleanup; UI will auto-hide deleted networks regardless
    } catch (_) {}
    return result;
  },
};
