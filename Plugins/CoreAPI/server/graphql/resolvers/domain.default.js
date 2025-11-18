export default {
  Domain: {
    async project(parent, args, { PenPalCachingAPI }) {
      return await PenPalCachingAPI.Projects.Get(parent.project);
    },
  },

  DomainsConnection: {
    domains(parent) {
      return parent.domains || [];
    },
  },
};
