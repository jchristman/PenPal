import PenPal from "#penpal/core";

export default {
  Plugin: {
    async id(root: any, _args: any, _context: any): Promise<string> {
      return root.id;
    },

    async name({ id }: { id: string }, _args: any, _context: any): Promise<string> {
      return PenPal.LoadedPlugins[id].name;
    },

    async version({ id }: { id: string }, _args: any, _context: any): Promise<string> {
      return PenPal.LoadedPlugins[id].version;
    },

    async settings({ id }: { id: string }, _args: any, _context: any): Promise<any> {
      return PenPal.LoadedPlugins[id].settings;
    },
  },
};
