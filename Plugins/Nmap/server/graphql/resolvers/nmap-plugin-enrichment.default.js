import PenPal from "#penpal/core";

const isNmapPluginEnrichment = (obj) => {
  if (obj.plugin_name === "Nmap") {
    return "NmapPluginEnrichment";
  }
  return null;
};

PenPal.Utils.RunAfterImport(async () => {
  await PenPal.Utils.Sleep(500); // TODO: need to come up with a more elegant way to handle this
  PenPal.API.InterfaceResolvers.PluginEnrichments.push(isNmapPluginEnrichment);
});

export default {
  NmapPluginEnrichment: {
    service(obj) {
      return obj.service;
    },
    fingerprint(obj) {
      return obj.fingerprint;
    },
    product(obj) {
      return obj.product;
    },
    version(obj) {
      return obj.version;
    },
    extra_info(obj) {
      return obj.extra_info;
    },
  },
};
