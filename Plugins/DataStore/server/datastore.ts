import PenPal from "#penpal/core";
import FlakeId from "flake-idgen";
import intformat from "biguint-format";
import _ from "lodash";

// Initialize logger for this module
const logger = PenPal.Utils.BuildLogger("DataStore");

interface Adapter {
  AdapterName: string;
  Adapter: any;
}

interface Analytics {
  RegisterAdapter: number;
  GetAdapter: number;
  CreateStore: number;
  DeleteStore: number;
  fetch: number;
  getPaginationInfo: number;
  fetchOne: number;
  insert: number;
  insertMany: number;
  updateOne: number;
  updateMany: number;
  delete: number;
}

const DataStore: any = {};
DataStore._Adapters = [] as Adapter[]; // Meant to be internal, so don't make it obviously accessible. Maybe make this a real class at some point?
DataStore._ID = { Generator: new FlakeId() };
DataStore._AdaptersReady = false; // Track adapter readiness state
DataStore._Analytics = {
  RegisterAdapter: 0,
  GetAdapter: 0,
  CreateStore: 0,
  DeleteStore: 0,
  fetch: 0,
  getPaginationInfo: 0,
  fetchOne: 0,
  insert: 0,
  insertMany: 0,
  updateOne: 0,
  updateMany: 0,
  delete: 0,
} as Analytics;

// -----------------------------------------------------------------------
// DataStore meta functions

DataStore.RegisterAdapter = (AdapterName: string, Adapter: any): number => {
  DataStore._Analytics.RegisterAdapter += 1;
  const result = DataStore._Adapters.push({ AdapterName, Adapter });

  // Check if all expected adapters are ready
  DataStore._checkAdaptersReady();

  return result;
};

DataStore.GetAdapter = (AdapterName: string): any => {
  DataStore._Analytics.GetAdapter += 1;
  return (
    _.find(
      DataStore._Adapters,
      (adapter: Adapter) => adapter.AdapterName === AdapterName
    )?.Adapter ?? null
  );
};

// Check if adapters are ready and connected
DataStore._checkAdaptersReady = async (): Promise<void> => {
  if (DataStore._Adapters.length === 0) {
    DataStore._AdaptersReady = false;
    return;
  }

  try {
    // Test if adapters are actually ready by attempting a simple operation
    for (const { AdapterName, Adapter } of DataStore._Adapters) {
      if (!Adapter.isReady || !(await Adapter.isReady())) {
        DataStore._AdaptersReady = false;
        return;
      }
    }
    DataStore._AdaptersReady = true;
    logger.info(`DataStore adapters are ready`);
  } catch (error: any) {
    DataStore._AdaptersReady = false;
  }
};

// Public function to check if adapters are ready
DataStore.AdaptersReady = (): boolean => {
  return DataStore._AdaptersReady;
};

// Function to mark adapters as ready (called by adapters when they're connected)
DataStore.SetAdaptersReady = (ready: boolean = true): void => {
  DataStore._AdaptersReady = ready;
  if (ready) {
    logger.info(`DataStore adapters marked as ready`);
  }
};

// -----------------------------------------------------------------------
// DataStore creation/deletion functions

DataStore.CreateStore = async (plugin_name: string, store_name: string): Promise<any[]> => {
  if (DataStore._AdaptersReady) {
    DataStore._Analytics.CreateStore += 1;
    return await Promise.all(
      DataStore._Adapters.map(async ({ AdapterName, Adapter }: Adapter) => ({
        AdapterName,
        result: (await Adapter.CreateStore?.(plugin_name, store_name)) ?? null,
      }))
    );
  } else {
    while (!DataStore._AdaptersReady) {
      await PenPal.Utils.Sleep(1000);
    }
    logger.info(`DataStore adapters are ready, creating store ${store_name}`);
    return DataStore.CreateStore(plugin_name, store_name);
  }
};

DataStore.CreateStores = async (plugin_name: string, stores: string[] = []): Promise<any[]> => {
  return await Promise.all(
    stores.map(
      async (store_name: string) => await DataStore.CreateStore(plugin_name, store_name)
    )
  );
};

DataStore.DeleteStore = async (plugin_name: string, store_name: string): Promise<any[]> => {
  DataStore._Analytics.DeleteStore += 1;
  return await Promise.all(
    DataStore._Adapters.map(async ({ AdapterName, Adapter }: Adapter) => ({
      AdapterName,
      result: (await Adapter.DeleteStore?.(plugin_name, store_name)) ?? null,
    }))
  );
};

// -----------------------------------------------------------------------
// DataStore operations
// TODO: Figure out how to abstract multiple results from multiple datastores

DataStore.fetch = async (plugin_name: string, store_name: string, selector: any, options?: any): Promise<any> => {
  DataStore._Analytics.fetch += 1;
  return (
    await Promise.all(
      DataStore._Adapters.map(async ({ AdapterName, Adapter }: Adapter) => ({
        AdapterName,
        result:
          Adapter.fetch?.(plugin_name, store_name, selector, options) ?? null,
      }))
    )
  )[0].result;
};

DataStore.getPaginationInfo = async (
  plugin_name: string,
  store_name: string,
  selector: any,
  options?: any
): Promise<any> => {
  DataStore._Analytics.getPaginationInfo += 1;
  return (
    await Promise.all(
      DataStore._Adapters.map(async ({ AdapterName, Adapter }: Adapter) => ({
        AdapterName,
        result:
          Adapter.getPaginationInfo?.(
            plugin_name,
            store_name,
            selector,
            options
          ) ?? null,
      }))
    )
  )[0].result;
};

DataStore.fetchOne = async (plugin_name: string, store_name: string, selector: any, options?: any): Promise<any> => {
  DataStore._Analytics.fetchOne += 1;
  return (
    await Promise.all(
      DataStore._Adapters.map(async ({ AdapterName, Adapter }: Adapter) => ({
        AdapterName,
        result:
          (await Adapter.fetchOne?.(
            plugin_name,
            store_name,
            selector,
            options
          )) ?? null,
      }))
    )
  )[0].result;
};

// On insert, we generate an ID for the different adapters to ensure consistency across the board
DataStore.insert = async (plugin_name: string, store_name: string, data: any): Promise<any> => {
  DataStore._Analytics.insert += 1;
  const id = intformat(DataStore._ID.Generator.next(), "hex");

  return (
    await Promise.all(
      DataStore._Adapters.map(async ({ AdapterName, Adapter }: Adapter) => ({
        AdapterName,
        result:
          (await Adapter.insert?.(plugin_name, store_name, {
            id,
            ...data,
          })) ?? null,
      }))
    )
  )[0].result;
};

// On insert, we generate an ID for the different adapters to ensure consistency across the board
DataStore.insertMany = async (plugin_name: string, store_name: string, data: any[]): Promise<any> => {
  DataStore._Analytics.insertMany += 1;
  const data_with_ids = data.map((datum: any) => ({
    id: intformat(DataStore._ID.Generator.next(), "hex"),
    ...datum,
  }));

  return (
    await Promise.all(
      DataStore._Adapters.map(async ({ AdapterName, Adapter }: Adapter) => ({
        AdapterName,
        result:
          (await Adapter.insertMany?.(
            plugin_name,
            store_name,
            data_with_ids
          )) ?? null,
      }))
    )
  )[0].result;
};

DataStore.updateOne = async (plugin_name: string, store_name: string, selector: any, data: any): Promise<any> => {
  DataStore._Analytics.updateOne += 1;

  return (
    await Promise.all(
      DataStore._Adapters.map(async ({ AdapterName, Adapter }: Adapter) => ({
        AdapterName,
        result:
          (await Adapter.updateOne?.(
            plugin_name,
            store_name,
            selector,
            data
          )) ?? null,
      }))
    )
  )[0].result;
};

DataStore.updateMany = async (plugin_name: string, store_name: string, selector: any, data: any): Promise<any> => {
  DataStore._Analytics.updateMany += 1;

  return (
    await Promise.all(
      DataStore._Adapters.map(async ({ AdapterName, Adapter }: Adapter) => ({
        AdapterName,
        result:
          (await Adapter.updateMany?.(
            plugin_name,
            store_name,
            selector,
            data
          )) ?? null,
      }))
    )
  )[0].result;
};

DataStore.delete = async (plugin_name: string, store_name: string, selector: any): Promise<any> => {
  DataStore._Analytics.delete += 1;

  return (
    await Promise.all(
      DataStore._Adapters.map(async ({ AdapterName, Adapter }: Adapter) => ({
        AdapterName,
        result:
          (await Adapter.delete?.(plugin_name, store_name, selector)) ?? null,
      }))
    )
  )[0].result;
};

// -----------------------------------------------------------------------

export default DataStore;
