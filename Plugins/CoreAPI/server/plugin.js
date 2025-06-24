import _ from "lodash";
import PenPal from "#penpal/core";
import DataLoader from "dataloader";
import stable_stringify from "fast-json-stable-stringify";

import { loadGraphQLFiles, resolvers } from "./graphql/index.js";
import * as API from "./api/index.js";
import { mocks } from "./test/index.js";
import {
  FileAttachmentType,
  FileAttachmentCategory,
  detectFileType,
  getFileCategory,
  validateFileType,
  getEnrichmentFileBucket,
} from "../common/file-attachment-constants.js";

// File-level logger that can be imported by other files
export const CoreAPILogger = PenPal.Utils.BuildLogger("CoreAPI");

const settings = {
  configuration: {
    schema_root: "CoreAPIConfiguration",
    getter: "getCoreAPIConfiguration",
    setter: "setCoreAPIConfiguration",
  },
  dashboard: {
    schema_root: "CoreAPIAnalytics",
    getter: "getCoreAPIAnalytics",
  },
  datastores: [
    {
      name: "Customers",
    },
    {
      name: "Projects",
    },
    {
      name: "Hosts",
    },
    {
      name: "Networks",
    },
    {
      name: "Services",
    },
    {
      name: "Configuration",
    },
  ],
};

const CoreAPIPlugin = {
  async loadPlugin() {
    // Register API Hooks
    PenPal.API.Customers = {
      Get: API.getCustomer,
      GetMany: API.getCustomers,
      Insert: API.insertCustomer,
      InsertMany: API.insertCustomers,
      Remove: API.removeCustomer,
      RemoveMany: API.removeCustomers,
      Update: API.updateCustomer,
      UpdateMany: API.updateCustomers,
      UpsertMany: API.upsertCustomers,
    };

    PenPal.API.Projects = {
      Get: API.getProject,
      GetMany: API.getProjects,
      GetPaginationInfo: API.getProjectsPaginationInfo,
      Insert: API.insertProject,
      InsertMany: API.insertProjects,
      Remove: API.removeProject,
      RemoveMany: API.removeProjects,
      Update: API.updateProject,
      UpdateMany: API.updateProjects,
      UpsertMany: API.upsertProjects,
    };

    PenPal.API.Hosts = {
      Get: API.getHost,
      GetMany: API.getHosts,
      GetPaginationInfo: API.getHostsPaginationInfo,
      GetManyByProjectID: API.getHostsByProject,
      GetManyByNetworkID: API.getHostsByNetwork,
      GetManyByNetworkIDs: API.getHostsByNetworks,
      Insert: API.insertHost,
      InsertMany: API.insertHosts,
      Remove: API.removeHost,
      RemoveMany: API.removeHosts,
      Update: API.updateHost,
      UpdateMany: API.updateHosts,
      UpsertMany: API.upsertHosts,
    };

    PenPal.API.Networks = {
      Get: API.getNetwork,
      GetMany: API.getNetworks,
      GetPaginationInfo: API.getNetworksPaginationInfo,
      GetManyByProjectID: API.getNetworksByProject,
      Insert: API.insertNetwork,
      InsertMany: API.insertNetworks,
      Remove: API.removeNetwork,
      RemoveMany: API.removeNetworks,
      Update: API.updateNetwork,
      UpdateMany: API.updateNetworks,
    };

    PenPal.API.Services = {
      Get: API.getService,
      GetMany: API.getServices,
      GetPaginationInfo: API.getServicesPaginationInfo,
      GetManyByHostID: API.getServicesByHost,
      GetManyByHostIDs: API.getServicesByHosts,
      GetManyByNetworkID: API.getServicesByNetwork,
      GetManyByProjectID: API.getServicesByProject,
      Insert: API.insertService,
      InsertMany: API.insertServices,
      Remove: API.removeService,
      RemoveMany: API.removeServices,
      Update: API.updateService,
      UpdateMany: API.updateServices,
      UpsertMany: API.upsertServices,
      // Enrichment Management Functions
      AddEnrichment: API.addEnrichment,
      AddEnrichments: API.addEnrichments,
      UpdateEnrichment: API.updateEnrichment,
      UpsertEnrichment: API.upsertEnrichment,
      RemoveEnrichment: API.removeEnrichment,
      // File Attachment Functions
      AttachFileToEnrichment: API.attachFileToEnrichment,
      GetEnrichmentFiles: API.getEnrichmentFiles,
      RemoveFileFromEnrichment: API.removeFileFromEnrichment,
      GenerateEnrichmentFileDownloadUrl: API.generateEnrichmentFileDownloadUrl,
      // File Attachment Helper Functions
      AttachScreenshotToHttpXEnrichment: API.attachScreenshotToHttpXEnrichment,
      AttachCertificateToEnrichment: API.attachCertificateToEnrichment,
      AttachLogToEnrichment: API.attachLogToEnrichment,
      AttachJsonReportToEnrichment: API.attachJsonReportToEnrichment,
      GetEnrichmentFilesByType: API.getEnrichmentFilesByType,
      GetEnrichmentScreenshots: API.getEnrichmentScreenshots,
      GetEnrichmentCertificates: API.getEnrichmentCertificates,
      GetEnrichmentLogs: API.getEnrichmentLogs,
    };

    // This builds a unique set of wrapped functions that can utilize the dataloader utility in
    // order to efficiently cache information on a per instantiation of the caching API basis.
    // This is primarily useful for the GraphQL wrapper around the API in order to allow calls
    // into the API from default resolvers to minimize duplication of database actions
    PenPal.API.CachingAPI = () => {
      const caching_apis = {};

      for (let api_key of Object.keys(PenPal.API)) {
        // The "batch" getter is the GetMany function
        const batch_api_getter = PenPal.API[api_key].GetMany;
        if (batch_api_getter === undefined) {
          continue;
        }

        // Build the dataloader
        const api_dataloader = new DataLoader(async (keys) => {
          const api_results = await batch_api_getter(keys);
          const api_results_map = _.keyBy(api_results, "id");
          return keys.map((key) => api_results_map[key]);
        });

        // When doing pagination, we can't easily decide what IDs are being fetched from the cache to
        // prevent overfetching. If we can cache the IDs returned per set of "options", then perhaps we
        // can utilize dataloader more efficiently
        const get_many_pagination_options_id_cache = {};
        const pagination_info_cache = {};

        const { Get, GetMany, GetPaginationInfo, ...OtherFunctions } =
          PenPal.API[api_key];

        // Build the object that's going to hold all the caching functions
        caching_apis[api_key] = {
          async Get(key) {
            const result = await api_dataloader.load(key);
            return result;
          },

          async GetMany(keys, options) {
            if (keys === undefined) {
              // There's no way to use a cache when all records are requested, so get all the records and
              // cache them for any future requests
              const results = await PenPal.API[api_key].GetMany();
              for (let result of results) {
                api_dataloader.clear(result.id).prime(result.id, result);
              }
              return results;
            } else if (options !== undefined) {
              // Deterministic stringify of the options to use as a key in the get_many_pagination_options_id_cache
              const keys_string = stable_stringify(keys);
              const options_string = stable_stringify(options);
              const cache_key = `${keys_string}:::${options_string}`;

              let results = [];
              let cached_ids = get_many_pagination_options_id_cache[cache_key];

              if (cached_ids === undefined) {
                // Mark this with a flag to indicate that it's loading to avoid race conditions. The await
                // later in this block will yield execution on the event loop, potentially allowing other
                // default resolvers to call this function with the same options string, but we only need to
                // execute one of them.
                get_many_pagination_options_id_cache[cache_key] = true;

                // There's no simple way to use the cache when doing pagination, so use the underlying DataStore
                // functionality to do so when options are passed in and then store the IDs in the pagination options cache
                results = await PenPal.API[api_key].GetMany(keys, options);

                for (let result of results) {
                  api_dataloader.clear(result.id).prime(result.id, result);
                }

                get_many_pagination_options_id_cache[cache_key] = results.map(
                  (result) => result.id
                );
              } else {
                // This will repeatedly yield to the event loop waiting for the get_many_pagination_options_id_cache gets results
                // from the PenPal API
                while (cached_ids === true) {
                  // Yield to event loop for 10 ms
                  await PenPal.Utils.AsyncNOOP(10);
                  cached_ids = get_many_pagination_options_id_cache[cache_key];
                }

                results = await api_dataloader.loadMany(cached_ids);
              }

              return results;
            } else {
              return await api_dataloader.loadMany(keys);
            }
          },

          // This is just syntactic sugar to conditionally create the function
          ...(GetPaginationInfo && {
            GetPaginationInfo: async function (keys, options) {
              // Deterministic stringify of the options to use as a key in the pagination_info_cache
              const keys_string = stable_stringify(keys);
              const options_string = stable_stringify(options);
              const cache_key = `${keys_string}:::${options_string}`;

              let cached_pagination_info = pagination_info_cache[cache_key];

              if (cached_pagination_info === undefined) {
                // Mark this with a flag to indicate that it's loading to avoid race conditions. The await
                // later in this block will yield execution on the event loop, potentially allowing other
                // default resolvers to call this function with the same options string, but we only need to
                // execute one of them.
                pagination_info_cache[cache_key] = true;

                const result = await PenPal.API[api_key].GetPaginationInfo(
                  keys,
                  options
                );

                pagination_info_cache[cache_key] = result;
                return result;
              } else {
                // This will repeatedly yield to the event loop waiting for the pagination_info_cache gets results
                // from the PenPal API
                while (cached_pagination_info === true) {
                  // Yield to event loop for 10 ms
                  await PenPal.Utils.AsyncNOOP(10);
                  cached_pagination_info = pagination_info_cache[cache_key];
                }

                return cached_pagination_info;
              }
            },
          }),

          // TODO: At some point consider using the "prime" functions of the data loader to cache the results
          // of and insert, update, etc
          ...OtherFunctions,
        };
      }

      return caching_apis;
    };

    const topic_root = "penpal/coreapi";
    PenPal.API.MQTT = await PenPal.MQTT.NewClient();
    PenPal.API.MQTT.Topics = {
      New: {
        Hosts: `${topic_root}/new/hosts`,
        Networks: `${topic_root}/new/networks`,
        Services: `${topic_root}/new/services`,
      },
      Update: {
        Hosts: `${topic_root}/update/hosts`,
        Networks: `${topic_root}/update/networks`,
        Services: `${topic_root}/update/services`,
      },
      Delete: {
        Hosts: `${topic_root}/delete/hosts`,
        Networks: `${topic_root}/delete/networks`,
        Services: `${topic_root}/delete/services`,
      },
    };

    // File Attachment Constants and Utilities
    PenPal.API.FileAttachment = {
      Type: FileAttachmentType,
      Category: FileAttachmentCategory,
      DetectFileType: detectFileType,
      GetFileCategory: getFileCategory,
      ValidateFileType: validateFileType,
      GetEnrichmentFileBucket: getEnrichmentFileBucket,
    };

    PenPal.Test.CoreAPI = { ...mocks };

    // Register test handlers with the Tester plugin (if available)
    if (PenPal.Tester) {
      // Simple test handler that returns API statistics
      PenPal.Tester.RegisterHandler(
        "CoreAPI",
        async () => {
          try {
            // Call with explicit empty arrays to ensure proper parameter handling
            const projects = await API.getProjects([]);
            const hosts = await API.getHosts([]);
            const services = await API.getServices([]);

            return {
              total_projects: projects.length,
              total_hosts: hosts.length,
              total_services: services.length,
              timestamp: new Date().toISOString(),
            };
          } catch (error) {
            return {
              error: error.message,
              stack: error.stack,
              timestamp: new Date().toISOString(),
            };
          }
        },
        [],
        "API Statistics"
      );

      // Test handler that creates a sample customer
      PenPal.Tester.RegisterHandler(
        "CoreAPI",
        async (customerName, contactEmail, industry) => {
          const customer = {
            name: customerName,
            contact_email: contactEmail,
            industry: industry,
            projects: [],
            created_at: new Date().toISOString(),
          };

          const result = await API.insertCustomer(customer);
          return result;
        },
        [
          {
            name: "customerName",
            type: "string",
            required: true,
            description: "Name of the customer",
          },
          {
            name: "contactEmail",
            type: "string",
            required: true,
            description: "Contact email for the customer",
          },
          {
            name: "industry",
            type: "string",
            required: true,
            description: "Customer's industry",
          },
        ],
        "Create Sample Customer"
      );

      // Test handler that tests database connectivity
      PenPal.Tester.RegisterHandler(
        "CoreAPI",
        async () => {
          try {
            const testQuery = await API.getProjects();
            return {
              database_connected: true,
              query_successful: true,
              response_time: Date.now(),
              message: "Database connectivity test passed",
            };
          } catch (error) {
            return {
              database_connected: false,
              query_successful: false,
              error: error.message,
              message: "Database connectivity test failed",
            };
          }
        },
        [],
        "Database Connectivity Test"
      );

      CoreAPILogger.info("Registered test handlers with Tester plugin");
    }

    const types = await loadGraphQLFiles();

    return {
      graphql: {
        types,
        resolvers,
      },
      settings,
    };
  },
};

export default CoreAPIPlugin;
