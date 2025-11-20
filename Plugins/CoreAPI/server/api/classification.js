import PenPal from "#penpal/core";

// Import the shared logger from plugin.js
import { CoreAPILogger as logger } from "../plugin.js";

// Import classification modules
import {
  lookupIP,
  lookupMultipleIPs,
  initializeMaxMindDatabases,
} from "./classification/ip-lookup.js";
import {
  getCloudRanges,
  getProviderForIp,
  updateRanges,
} from "./classification/cloud-ranges.js";

// Classification API functions
export const classifyIP = async (ip) => {
  try {
    logger.log(`Classifying IP: ${ip}`);

    // Get geolocation data from MaxMind
    const geoData = await lookupIP(ip);

    // Get cloud provider information
    const cloudData = await getProviderForIp(ip);

    // Combine the data
    const classification = {
      ...geoData,
      cloud_provider: cloudData
        ? {
            provider: cloudData.provider,
            service: cloudData.service,
            region: cloudData.region,
          }
        : null,
    };

    logger.log(
      `Classification complete for ${ip}: ${
        classification.country || "Unknown"
      } ${classification.cloud_provider?.provider || "Non-cloud"}`
    );
    return classification;
  } catch (error) {
    logger.error(`Failed to classify IP ${ip}:`, error.message);
    // Return fallback classification
    return {
      ip: ip,
      country: "Unknown",
      country_code: null,
      region: null,
      city: null,
      latitude: null,
      longitude: null,
      timezone: null,
      asn: null,
      org: "Unknown ASN",
      cloud_provider: null,
      last_updated: new Date().toISOString(),
      source: "classification-error",
      error: error.message,
    };
  }
};

export const classifyIPs = async (ips) => {
  try {
    logger.log(`Classifying ${ips.length} IPs`);

    // Get geolocation data for all IPs
    const geoData = await lookupMultipleIPs(ips);

    // Get cloud provider information for all IPs
    const cloudDataPromises = ips.map((ip) => getProviderForIp(ip));
    const cloudDataResults = await Promise.allSettled(cloudDataPromises);

    // Combine the data
    const classifications = {};
    for (const ip of ips) {
      const geo = geoData[ip] || {};
      const cloudResult = cloudDataResults[ips.indexOf(ip)];
      const cloud =
        cloudResult.status === "fulfilled" ? cloudResult.value : null;

      classifications[ip] = {
        ...geo,
        cloud_provider: cloud
          ? {
              provider: cloud.provider,
              service: cloud.service,
              region: cloud.region,
            }
          : null,
      };
    }

    logger.log(
      `Classification complete for ${Object.keys(classifications).length} IPs`
    );
    return classifications;
  } catch (error) {
    logger.error(`Failed to classify IPs:`, error.message);
    // Return fallback classifications
    const fallback = {};
    for (const ip of ips) {
      fallback[ip] = {
        ip: ip,
        country: "Unknown",
        country_code: null,
        region: null,
        city: null,
        latitude: null,
        longitude: null,
        timezone: null,
        asn: null,
        org: "Unknown ASN",
        cloud_provider: null,
        last_updated: new Date().toISOString(),
        source: "classification-error",
        error: error.message,
      };
    }
    return fallback;
  }
};

// Initialize the classification system
export const initializeClassification = async () => {
  try {
    logger.log("Initializing IP classification system...");

    // Initialize MaxMind databases
    await initializeMaxMindDatabases();

    // Update cloud ranges (this will download if needed)
    await getCloudRanges();

    logger.log("IP classification system initialized");
  } catch (error) {
    logger.error("Failed to initialize classification system:", error.message);
    throw error;
  }
};

// Export individual modules for advanced usage
export {
  lookupIP,
  lookupMultipleIPs,
  getCloudRanges,
  getProviderForIp,
  updateRanges,
};
