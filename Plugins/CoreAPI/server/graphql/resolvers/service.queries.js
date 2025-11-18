export default {
  async getServices(root, args, { PenPalCachingAPI }) {
    const services = await PenPalCachingAPI.Services.GetManyByProjectID(args.projectID);

    // Filter out services with invalid host references to prevent GraphQL errors
    const validServices = [];
    for (const service of services) {
      if (!service.host) {
        console.warn(`Service ${service.id} has null host reference, skipping`);
        continue;
      }

      try {
        // Try to fetch the host to ensure it exists and has valid data
        const host = await PenPalCachingAPI.Hosts.Get(service.host);
        if (!host || !host.id) {
          console.warn(`Service ${service.id} references invalid host ${service.host}, skipping`);
          continue;
        }
        validServices.push(service);
      } catch (error) {
        console.warn(`Error fetching host ${service.host} for service ${service.id}:`, error.message);
        continue;
      }
    }

    return validServices;
  },
  async getService(root, args, { PenPalCachingAPI }) {
    return await PenPalCachingAPI.Services.Get(args);
  },
};
