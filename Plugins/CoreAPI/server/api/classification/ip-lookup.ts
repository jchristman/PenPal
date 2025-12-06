/**
 * IP Geolocation and ASN Lookup Module for PenPal AutoRecon
 * Uses MaxMind GeoLite2 databases for offline IP intelligence
 */

import fs from "fs";
import path from "path";
import { Reader } from "@maxmind/geoip2-node";
import https from "https";
import { fileURLToPath } from "url";
import { dirname } from "path";
import PenPal from "#penpal/core";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the shared logger from plugin.js
import { CoreAPILogger as logger } from "../../plugin.ts";

// Database paths
const DB_DIR = path.join(__dirname, "..", "geoip-db");
const COUNTRY_DB = path.join(DB_DIR, "GeoLite2-Country.mmdb");
const CITY_DB = path.join(DB_DIR, "GeoLite2-City.mmdb");
const ASN_DB = path.join(DB_DIR, "GeoLite2-ASN.mmdb");

// Database update settings
const DB_UPDATE_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
const DB_UPDATE_CHECK_FILE = path.join(DB_DIR, "last-update-check");

// MaxMind account details (for automatic database downloads)
// These should be set via environment variables for security
const MAXMIND_ACCOUNT_ID = process.env.MAXMIND_ACCOUNT_ID;
const MAXMIND_LICENSE_KEY = process.env.MAXMIND_LICENSE_KEY;

// Simple in-memory cache for IP lookups (cleared on restart)
const ipCache = new Map();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Database readers (loaded on first use)
let countryReader = null;
let cityReader = null;
let asnReader = null;

// Ensure database directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Download MaxMind database from URL with redirect handling
async function downloadDatabase(url, outputPath, dbName, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    logger.log(`Downloading ${dbName} from ${url} to ${outputPath}...`);
    const file = fs.createWriteStream(outputPath);

    const request = https.get(
      url,
      {
        headers: {
          "User-Agent": "penpal-autorecon/1.0",
        },
      },
      (response) => {
        logger.log(
          `Got response for ${dbName}: HTTP ${response.statusCode}, content-length: ${response.headers["content-length"]}`
        );

        // Handle redirects (302, 301)
        if (response.statusCode === 302 || response.statusCode === 301) {
          const redirectUrl = response.headers.location;
          if (redirectUrl && redirectCount < 5) {
            // Limit redirect depth
            logger.log(`Following redirect for ${dbName} to ${redirectUrl}`);
            request.destroy();
            file.close();
            fs.unlink(outputPath, () => {}); // Clean up empty file
            // Retry with the redirect URL
            downloadDatabase(redirectUrl, outputPath, dbName, redirectCount + 1)
              .then(resolve)
              .catch(reject);
            return;
          } else {
            reject(
              new Error(`Too many redirects or no redirect URL for ${dbName}`)
            );
            return;
          }
        }

        if (response.statusCode !== 200) {
          reject(
            new Error(
              `Failed to download ${dbName}: HTTP ${response.statusCode}`
            )
          );
          return;
        }

        let downloadedBytes = 0;
        response.on("data", (chunk) => {
          downloadedBytes += chunk.length;
        });

        response.pipe(file);

        file.on("finish", () => {
          file.close();
          const fileSize = fs.statSync(outputPath).size;
          logger.log(
            `Downloaded ${dbName} (${fileSize} bytes, received ${downloadedBytes} bytes)`
          );
          resolve();
        });

        file.on("close", () => {
          logger.log(`File stream closed for ${dbName}`);
        });

        file.on("error", (err) => {
          logger.error(`File write error for ${dbName}:`, err.message);
          fs.unlink(outputPath, () => {});
          reject(new Error(`Failed to write ${dbName}: ${err.message}`));
        });
      }
    );

    request.on("error", (err) => {
      logger.error(`Request error for ${dbName}:`, err.message);
      fs.unlink(outputPath, () => {});
      reject(new Error(`Failed to download ${dbName}: ${err.message}`));
    });

    request.setTimeout(120000, () => {
      // Increased timeout to 2 minutes
      logger.error(`Timeout downloading ${dbName}`);
      request.destroy();
      fs.unlink(outputPath, () => {});
      reject(new Error(`Timeout downloading ${dbName}`));
    });
  });
}

// Download all required MaxMind databases
async function downloadDatabases() {
  const databases = [
    {
      url: "https://github.com/P3TERX/GeoLite.mmdb/raw/download/GeoLite2-Country.mmdb",
      path: COUNTRY_DB,
      name: "GeoLite2-Country",
    },
    {
      url: "https://github.com/P3TERX/GeoLite.mmdb/raw/download/GeoLite2-City.mmdb",
      path: CITY_DB,
      name: "GeoLite2-City",
    },
    {
      url: "https://github.com/P3TERX/GeoLite.mmdb/raw/download/GeoLite2-ASN.mmdb",
      path: ASN_DB,
      name: "GeoLite2-ASN",
    },
  ];

  logger.log("Downloading MaxMind GeoLite2 databases...");

  const downloadPromises = databases.map(async (db) => {
    try {
      await downloadDatabase(db.url, db.path, db.name);
      return { success: true, name: db.name };
    } catch (error) {
      logger.error(`Failed to download ${db.name}:`, error.message);
      return { success: false, name: db.name, error: error.message };
    }
  });

  const results = await Promise.allSettled(downloadPromises);
  const successful = results.filter(
    (r) => r.status === "fulfilled" && r.value.success
  ).length;
  const failed = results.filter(
    (r) => r.status === "rejected" || !r.value.success
  ).length;

  logger.log(
    `MaxMind database download completed: ${successful} successful, ${failed} failed`
  );

  return { successful, failed };
}

// Download and update MaxMind databases
async function updateDatabases() {
  logger.log("updateDatabases called");
  const now = Date.now();
  let lastUpdate = 0;

  // Check when we last updated
  try {
    if (fs.existsSync(DB_UPDATE_CHECK_FILE)) {
      lastUpdate = parseInt(fs.readFileSync(DB_UPDATE_CHECK_FILE, "utf8"));
    }
  } catch (error) {
    logger.warn("Could not read last update check file:", error.message);
  }

  // Check if databases exist and have content (not 0-byte files)
  const hasAllDBs = [COUNTRY_DB, CITY_DB, ASN_DB].every((db) => {
    if (!fs.existsSync(db)) return false;
    try {
      const stats = fs.statSync(db);
      return stats.size > 0; // Must have content
    } catch (error) {
      return false; // Can't stat the file
    }
  });
  logger.log(
    `Database check: hasAllDBs=${hasAllDBs}, lastUpdate=${lastUpdate}, now=${now}, diff=${
      now - lastUpdate
    }`
  );

  // Download databases if they don't exist or if it's time for an update
  if (!hasAllDBs || now - lastUpdate >= DB_UPDATE_INTERVAL) {
    if (!hasAllDBs) {
      logger.log("MaxMind databases not found, downloading...");
    } else {
      logger.log("Checking for MaxMind database updates...");
    }

    try {
      logger.log("Calling downloadDatabases...");
      const result = await downloadDatabases();
      logger.log(
        `MaxMind database update result: ${result.successful} downloaded, ${result.failed} failed`
      );

      // Update the check timestamp
      try {
        fs.writeFileSync(DB_UPDATE_CHECK_FILE, now.toString());
      } catch (error) {
        logger.warn("Could not write update check file:", error.message);
      }
    } catch (error) {
      logger.error("Failed to download MaxMind databases:", error.message);
      logger.error("Error details:", error);
      logger.log("IP lookup will be limited until databases are available");
    }
  } else {
    logger.log("Skipping database download - all exist and recent enough");
  }

  // Note: Paid MaxMind API integration could be added here in the future
  // For now, we use the free GeoLite2 databases
}

// Load database readers
async function loadReaders() {
  // Ensure databases are downloaded and up to date before trying to load them
  await updateDatabases();

  if (countryReader !== false && !countryReader && fs.existsSync(COUNTRY_DB)) {
    try {
      const stats = fs.statSync(COUNTRY_DB);
      if (stats.size > 0) {
        countryReader = await Reader.open(COUNTRY_DB);
        logger.log("Loaded GeoLite2-Country database");
      } else {
        logger.warn("GeoLite2-Country database exists but is empty");
      }
    } catch (error) {
      logger.warn("Failed to load GeoLite2-Country database:", error.message);
      // Mark as failed to prevent repeated attempts
      countryReader = false; // Use false to indicate failed load
    }
  }

  if (cityReader !== false && !cityReader && fs.existsSync(CITY_DB)) {
    try {
      const stats = fs.statSync(CITY_DB);
      if (stats.size > 0) {
        cityReader = await Reader.open(CITY_DB);
        logger.log("Loaded GeoLite2-City database");
      } else {
        logger.warn("GeoLite2-City database exists but is empty");
      }
    } catch (error) {
      logger.warn("Failed to load GeoLite2-City database:", error.message);
      // Mark as failed to prevent repeated attempts
      cityReader = false; // Use false to indicate failed load
    }
  }

  if (asnReader !== false && !asnReader && fs.existsSync(ASN_DB)) {
    try {
      const stats = fs.statSync(ASN_DB);
      if (stats.size > 0) {
        asnReader = await Reader.open(ASN_DB);
        logger.log("Loaded GeoLite2-ASN database");
      } else {
        logger.warn("GeoLite2-ASN database exists but is empty");
      }
    } catch (error) {
      logger.warn("Failed to load GeoLite2-ASN database:", error.message);
      // Mark as failed to prevent repeated attempts
      asnReader = false; // Use false to indicate failed load
    }
  }
}

// Export initialization function to be called by plugin
export async function initializeMaxMindDatabases() {
  try {
    await updateDatabases(); // This will download databases if needed
    // Only try to load readers if they haven't been marked as failed
    if (
      countryReader !== false ||
      cityReader !== false ||
      asnReader !== false
    ) {
      await loadReaders();
    }
    logger.log("MaxMind databases initialized (downloaded if needed)");
  } catch (error) {
    logger.error("Failed to initialize MaxMind databases:", error.message);
  }
}

async function lookupIP(ip) {
  // Check cache first
  const cacheKey = `ip:${ip}`;
  const cached = ipCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  // Ensure readers are loaded (only if not already failed)
  if (
    countryReader !== false &&
    cityReader !== false &&
    asnReader !== false &&
    (!countryReader || !cityReader || !asnReader)
  ) {
    await loadReaders();
  }

  let countryData = null;
  let cityData = null;
  let asnData = null;
  let errors = [];

  // Lookup country information
  try {
    if (countryReader && countryReader !== false) {
      countryData = countryReader.country(ip);
    } else {
      errors.push("GeoLite2-Country database not available");
    }
  } catch (error) {
    errors.push(`Country lookup failed: ${error.message}`);
  }

  // Lookup city information (more detailed than country)
  try {
    if (cityReader && cityReader !== false) {
      cityData = cityReader.city(ip);
    } else {
      errors.push("GeoLite2-City database not available");
    }
  } catch (error) {
    errors.push(`City lookup failed: ${error.message}`);
  }

  // Lookup ASN information
  try {
    if (asnReader && asnReader !== false) {
      asnData = asnReader.asn(ip);
    } else {
      errors.push("GeoLite2-ASN database not available");
    }
  } catch (error) {
    errors.push(`ASN lookup failed: ${error.message}`);
  }

  // If all databases failed, provide fallback classification
  if (!countryData && !cityData && !asnData) {
    logger.warn(
      `All MaxMind database lookups failed for ${ip}:`,
      errors.join(", ")
    );

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
      last_updated: new Date().toISOString(),
      source: "maxmind-offline-failed",
      db_errors: errors,
    };
  }

  // Build result from available MaxMind data
  // Use city data if available (more detailed), otherwise fall back to country data
  const geoData = cityData || countryData;

  const result = {
    ip: ip,
    // Geolocation data (prefer city over country for more detail)
    country: geoData?.country?.names?.en || geoData?.country?.isoCode,
    country_code: geoData?.country?.isoCode,
    region:
      geoData?.subdivisions?.[0]?.names?.en ||
      geoData?.subdivisions?.[0]?.isoCode,
    city: geoData?.city?.names?.en,
    latitude: geoData?.location?.latitude,
    longitude: geoData?.location?.longitude,
    timezone: geoData?.location?.timeZone,
    // ASN data
    asn: asnData?.autonomousSystemNumber?.toString(),
    org: asnData?.autonomousSystemOrganization,
    // Metadata
    last_updated: new Date().toISOString(),
    source: "maxmind-offline",
    db_errors: errors.length > 0 ? errors : undefined,
  };

  // Cache the result
  ipCache.set(cacheKey, { data: result, timestamp: Date.now() });

  return result;
}

async function lookupMultipleIPs(ips) {
  const results = {};
  const promises = ips.map((ip) =>
    lookupIP(ip)
      .then((data) => {
        results[ip] = data;
      })
      .catch((error) => {
        logger.error(`lookupIP failed for ${ip}:`, error.message);
        // Still add a fallback result
        results[ip] = {
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
          last_updated: new Date().toISOString(),
          source: "lookup-error",
          error: error.message,
        };
      })
  );

  await Promise.allSettled(promises);
  return results;
}

// Clean old cache entries (run periodically)
function cleanCache() {
  const now = Date.now();
  for (const [key, value] of ipCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      ipCache.delete(key);
    }
  }
}

// Clean cache every hour
setInterval(cleanCache, 60 * 60 * 1000);

export { lookupIP, lookupMultipleIPs, cleanCache };
