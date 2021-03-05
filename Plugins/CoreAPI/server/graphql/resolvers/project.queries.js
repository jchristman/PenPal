export default {
  async getProject(root, { id }, { PenPalCachingAPI }) {
    // Return the id and let the default resolvers do the work
    const project = await PenPalCachingAPI.Projects.Get(id);
    if (project === undefined) throw new Meteor.Error(404, "Project not found");
    return { id };
  },

  async getProjects(root, args, { PenPalCachingAPI }) {
    // Return the args here so they are in the root object for the default resolvers for ProjectsConnection
    return { args: { ...args, sort: -1 } };
  }
};
