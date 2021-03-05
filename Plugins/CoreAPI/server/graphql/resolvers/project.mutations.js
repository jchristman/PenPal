export default {
  async createProject(
    root,
    { project: { scope: { hosts = [], networks = [] } = {}, ...project } },
    { PenPalCachingAPI }
  ) {
    const { accepted, rejected } = await PenPalCachingAPI.Projects.Insert(
      project
    );

    if (accepted.length > 0) {
      // We need to get the project so we can update it
      const project = await PenPalCachingAPI.Projects.Get(accepted[0].id);

      if (hosts.length > 0) {
        // Now insert the hosts and networks with the appropriate project ID
        const { accepted: new_hosts } = await PenPalCachingAPI.Hosts.InsertMany(
          hosts.map((host_ip) => ({ project: project.id, ip_address: host_ip }))
        );

        // NOTE: This will maybe cause a memory error if new_hosts has a length > 100,000 ish. Is this actually a problem?
        project.scope.hosts.push(...new_hosts.map((host) => host.id));
      }

      if (networks.length > 0) {
        const {
          accepted: new_networks
        } = await PenPalCachingAPI.Networks.InsertMany(
          networks.map((subnet) => ({ project: project.id, subnet }))
        );

        // NOTE: This will maybe cause a memory error if new_hosts has a length > 100,000 ish. Is this actually a problem?
        project.scope.networks.push(
          ...new_networks.map((network) => network.id)
        );
      }

      await PenPalCachingAPI.Projects.Update({
        id: project.id,
        "scope.hosts": project.scope.hosts,
        "scope.networks": project.scope.networks
      });

      return project;
    } else {
      throw rejected[0].error;
    }
  },

  async updateProject(root, { project }, { PenPalCachingAPI }) {
    const { accepted, rejected } = await PenPalCachingAPI.Projects.Update(
      project
    );

    if (accepted.length > 0) {
      return accepted[0];
    } else {
      throw rejected[0].error;
    }
  },

  async removeProject(root, { id }, { PenPalCachingAPI }) {
    return await PenPalCachingAPI.Projects.Remove(id);
  }
};
