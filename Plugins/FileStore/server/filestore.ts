import PenPal from "#penpal/core";
import FlakeId from "flake-idgen";
import intformat from "biguint-format";
import _ from "lodash";

// Import the shared logger from plugin.ts
import { FileStoreLogger as logger } from "./plugin.ts";

interface AdapterInfo {
  AdapterName: string;
  Adapter: any;
}

interface FileStoreAnalytics {
  RegisterAdapter: number;
  GetAdapter: number;
  CreateBucket: number;
  DeleteBucket: number;
  ListBuckets: number;
  UploadFile: number;
  DownloadFile: number;
  DeleteFile: number;
  ListFiles: number;
  GetFileInfo: number;
  GetUploadStream: number;
  GetDownloadStream: number;
}

interface FileStoreInstance {
  _Adapters: AdapterInfo[];
  _ID: { Generator: FlakeId };
  _AdaptersReady: boolean;
  _Analytics: FileStoreAnalytics;
  RegisterAdapter: (AdapterName: string, Adapter: any) => number;
  GetAdapter: (AdapterName: string) => any;
  _checkAdaptersReady: () => Promise<void>;
  AdaptersReady: () => boolean;
  SetAdaptersReady: (ready?: boolean) => void;
  CreateBucket: (bucket_name: string, options?: any) => Promise<any>;
  DeleteBucket: (bucket_name: string) => Promise<any>;
  ListBuckets: () => Promise<any>;
  UploadFile: (bucket_name: string, file_key: string, file_data: any, options?: any) => Promise<any>;
  DownloadFile: (bucket_name: string, file_key: string) => Promise<any>;
  DeleteFile: (bucket_name: string, file_key: string) => Promise<any>;
  ListFiles: (bucket_name: string, options?: any) => Promise<any>;
  GetFileInfo: (bucket_name: string, file_key: string) => Promise<any>;
  GetUploadStream: (bucket_name: string, file_key: string, options?: any) => Promise<any>;
  GetDownloadStream: (bucket_name: string, file_key: string) => Promise<any>;
  CreateBuckets: (plugin_name: string, bucket_names: string[]) => Promise<any>;
  GenerateID: () => string;
}

const FileStore = {};
FileStore._Adapters = []; // Internal adapter registry
FileStore._ID = { Generator: new FlakeId() };
FileStore._AdaptersReady = false; // Track adapter readiness state
FileStore._Analytics = {
  RegisterAdapter: 0,
  GetAdapter: 0,
  CreateBucket: 0,
  DeleteBucket: 0,
  ListBuckets: 0,
  UploadFile: 0,
  DownloadFile: 0,
  DeleteFile: 0,
  ListFiles: 0,
  GetFileInfo: 0,
  GetUploadStream: 0,
  GetDownloadStream: 0,
};

// -----------------------------------------------------------------------
// FileStore meta functions

FileStore.RegisterAdapter = (AdapterName: string, Adapter: any): number => {
  FileStore._Analytics.RegisterAdapter += 1;
  const result = FileStore._Adapters.push({ AdapterName, Adapter });

  // Check if all expected adapters are ready
  FileStore._checkAdaptersReady();

  return result;
};

FileStore.GetAdapter = (AdapterName: string): any => {
  FileStore._Analytics.GetAdapter += 1;
  return (
    _.find(
      FileStore._Adapters,
      (adapter: AdapterInfo) => adapter.AdapterName === AdapterName
    )?.Adapter ?? null
  );
};

// Check if adapters are ready and connected
FileStore._checkAdaptersReady = async (): Promise<void> => {
  if (FileStore._Adapters.length === 0) {
    FileStore._AdaptersReady = false;
    return;
  }

  try {
    // Test if adapters are actually ready by attempting a simple operation
    for (const { AdapterName, Adapter } of FileStore._Adapters) {
      if (!Adapter.isReady || !(await Adapter.isReady())) {
        FileStore._AdaptersReady = false;
        return;
      }
    }
    FileStore._AdaptersReady = true;
    logger.info(`FileStore adapters are ready`);
  } catch (error) {
    FileStore._AdaptersReady = false;
  }
};

// Public function to check if adapters are ready
FileStore.AdaptersReady = (): boolean => {
  return FileStore._AdaptersReady;
};

// Function to mark adapters as ready (called by adapters when they're connected)
FileStore.SetAdaptersReady = (ready: boolean = true): void => {
  FileStore._AdaptersReady = ready;
  if (ready) {
    logger.info(`FileStore adapters marked as ready`);
  }
};

// -----------------------------------------------------------------------
// FileStore bucket management functions

FileStore.CreateBucket = async (bucket_name: string, options: any = {}): Promise<any> => {
  if (FileStore._AdaptersReady) {
    FileStore._Analytics.CreateBucket += 1;
    return await Promise.all(
      FileStore._Adapters.map(async ({ AdapterName, Adapter }) => ({
        AdapterName,
        result: (await Adapter.CreateBucket?.(bucket_name, options)) ?? null,
      }))
    );
  } else {
    while (!FileStore._AdaptersReady) {
      await PenPal.Utils.Sleep(1000);
    }
    logger.info(
      `FileStore adapters are ready, creating bucket ${bucket_name}`
    );
    return FileStore.CreateBucket(bucket_name, options);
  }
};

FileStore.DeleteBucket = async (bucket_name: string): Promise<any> => {
  FileStore._Analytics.DeleteBucket += 1;
  return await Promise.all(
    FileStore._Adapters.map(async ({ AdapterName, Adapter }) => ({
      AdapterName,
      result: (await Adapter.DeleteBucket?.(bucket_name)) ?? null,
    }))
  );
};

FileStore.CreateBuckets = async (plugin_name: string, buckets: string[] = []): Promise<any> => {
  return await Promise.all(
    buckets.map(
      async (bucket_name) => await FileStore.CreateBucket(bucket_name)
    )
  );
};

FileStore.ListBuckets = async (): Promise<any> => {
  FileStore._Analytics.ListBuckets += 1;
  return (
    await Promise.all(
      FileStore._Adapters.map(async ({ AdapterName, Adapter }) => ({
        AdapterName,
        result: (await Adapter.ListBuckets?.()) ?? null,
      }))
    )
  )[0].result;
};

// -----------------------------------------------------------------------
// FileStore file operations

FileStore.UploadFile = async (
  bucket_name: string,
  file_name: string,
  file_data: any,
  metadata: any = {}
): Promise<any> => {
  FileStore._Analytics.UploadFile += 1;
  const file_id = intformat(FileStore._ID.Generator.next(), "hex");

  const file_info = {
    id: file_id,
    bucket: bucket_name,
    name: file_name,
    size: file_data.length || file_data.size,
    contentType: metadata.contentType,
    metadata: metadata,
    uploadedAt: new Date().toISOString(),
  };

  return (
    await Promise.all(
      FileStore._Adapters.map(async ({ AdapterName, Adapter }) => ({
        AdapterName,
        result:
          (await Adapter.UploadFile?.(
            bucket_name,
            file_name,
            file_data,
            file_info
          )) ?? null,
      }))
    )
  )[0].result;
};

FileStore.DownloadFile = async (bucket_name: string, file_name: string): Promise<any> => {
  FileStore._Analytics.DownloadFile += 1;
  return (
    await Promise.all(
      FileStore._Adapters.map(async ({ AdapterName, Adapter }) => ({
        AdapterName,
        result: (await Adapter.DownloadFile?.(bucket_name, file_name)) ?? null,
      }))
    )
  )[0].result;
};

FileStore.DeleteFile = async (bucket_name: string, file_name: string): Promise<any> => {
  FileStore._Analytics.DeleteFile += 1;
  return (
    await Promise.all(
      FileStore._Adapters.map(async ({ AdapterName, Adapter }) => ({
        AdapterName,
        result: (await Adapter.DeleteFile?.(bucket_name, file_name)) ?? null,
      }))
    )
  )[0].result;
};

FileStore.GetFileInfo = async (bucket_name: string, file_name: string): Promise<any> => {
  FileStore._Analytics.GetFileInfo += 1;
  return (
    await Promise.all(
      FileStore._Adapters.map(async ({ AdapterName, Adapter }) => ({
        AdapterName,
        result: (await Adapter.GetFileInfo?.(bucket_name, file_name)) ?? null,
      }))
    )
  )[0].result;
};

FileStore.ListFiles = async (bucket_name: string, options: any = {}): Promise<any> => {
  FileStore._Analytics.ListFiles += 1;
  return (
    await Promise.all(
      FileStore._Adapters.map(async ({ AdapterName, Adapter }) => ({
        AdapterName,
        result: (await Adapter.ListFiles?.(bucket_name, options)) ?? null,
      }))
    )
  )[0].result;
};

// -----------------------------------------------------------------------
// FileStore streaming operations for large files

FileStore.GetUploadStream = async (bucket_name: string, file_name: string, metadata: any = {}): Promise<any> => {
  FileStore._Analytics.GetUploadStream += 1;
  const file_id = intformat(FileStore._ID.Generator.next(), "hex");

  const file_info = {
    id: file_id,
    bucket: bucket_name,
    name: file_name,
    contentType: metadata.contentType,
    metadata: metadata,
    uploadedAt: new Date().toISOString(),
  };

  return (
    await Promise.all(
      FileStore._Adapters.map(async ({ AdapterName, Adapter }) => ({
        AdapterName,
        result:
          (await Adapter.GetUploadStream?.(
            bucket_name,
            file_name,
            file_info
          )) ?? null,
      }))
    )
  )[0].result;
};

FileStore.GetDownloadStream = async (bucket_name: string, file_name: string): Promise<any> => {
  FileStore._Analytics.GetDownloadStream += 1;
  return (
    await Promise.all(
      FileStore._Adapters.map(async ({ AdapterName, Adapter }) => ({
        AdapterName,
        result:
          (await Adapter.GetDownloadStream?.(bucket_name, file_name)) ?? null,
      }))
    )
  )[0].result;
};

// -----------------------------------------------------------------------
// FileStore URL generation for direct access

FileStore.GenerateUploadUrl = async (bucket_name: string, file_name: string, options: any = {}): Promise<any> => {
  return (
    await Promise.all(
      FileStore._Adapters.map(async ({ AdapterName, Adapter }) => ({
        AdapterName,
        result:
          (await Adapter.GenerateUploadUrl?.(
            bucket_name,
            file_name,
            options
          )) ?? null,
      }))
    )
  )[0].result;
};

FileStore.GenerateDownloadUrl = async (
  bucket_name: string,
  file_name: string,
  options: any = {}
): Promise<any> => {
  return (
    await Promise.all(
      FileStore._Adapters.map(async ({ AdapterName, Adapter }) => ({
        AdapterName,
        result:
          (await Adapter.GenerateDownloadUrl?.(
            bucket_name,
            file_name,
            options
          )) ?? null,
      }))
    )
  )[0].result;
};

// -----------------------------------------------------------------------

export default FileStore;
