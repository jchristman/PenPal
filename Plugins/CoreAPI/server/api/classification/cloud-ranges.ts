#!/usr/bin/env node
/**
 * Cloud Provider IP Ranges Auto-Loader for PenPal AutoRecon
 * Zero dependencies beyond native Node.js (18+)
 * Optional: npm i ip-cidr for IP matching
 */

import fs from "fs";
import path from "path";
import https from "https";
import { URL } from "url";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Import the shared logger from plugin.js
import { CoreAPILogger as logger } from "../../plugin.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CACHE_FILE = path.join(__dirname, "..", "cloud-ranges.json");
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const SOURCES = [
  {
    name: "AWS",
    url: "https://ip-ranges.amazonaws.com/ip-ranges.json",
    parse: (data) => {
      const ranges = [];
      for (const item of data.prefixes) {
        if (item.ip_prefix)
          ranges.push({
            cidr: item.ip_prefix,
            provider: "AWS",
            service: item.service,
            region: item.region,
          });
      }
      for (const item of data.ipv6_prefixes) {
        if (item.ipv6_prefix)
          ranges.push({
            cidr: item.ipv6_prefix,
            provider: "AWS",
            service: item.service,
            region: item.region,
          });
      }
      return ranges;
    },
  },
  {
    name: "Google Cloud",
    url: "https://www.gstatic.com/ipranges/cloud.json",
    parse: (data) =>
      data.prefixes.map((p) => ({
        cidr: p.ipv4Prefix || p.ipv6Prefix,
        provider: "GCP",
        service: p.service,
        region: p.scope,
      })),
  },
  {
    name: "Microsoft Azure",
    url: "https://api.github.com/repos/Azure/azure-docs/contents/articles/virtual-network/service-tags-overview",
    parse: (data) => {
      // Fallback: Use static Azure ranges since official API is problematic
      // These are major Azure regions - in production, this would be updated periodically
      const azureRanges = [
        // Azure Public Cloud - East US
        "20.140.0.0/15",
        "20.142.0.0/15",
        "20.144.0.0/15",
        // Azure Public Cloud - West US
        "13.64.0.0/11",
        "13.96.0.0/13",
        "13.104.0.0/14",
        // Azure Public Cloud - West Europe
        "13.69.0.0/16",
        "13.70.0.0/15",
        "13.72.0.0/14",
        // Azure Public Cloud - Southeast Asia
        "13.67.0.0/16",
        "13.68.0.0/14",
        "13.72.0.0/13",
        // Azure Public Cloud - Australia East
        "13.70.64.0/18",
        "13.70.128.0/17",
        "13.71.0.0/16",
        // Azure Public Cloud - Canada Central
        "13.71.128.0/17",
        "13.71.192.0/18",
        "13.72.0.0/14",
        // Azure Public Cloud - UK South
        "13.87.0.0/16",
        "13.88.0.0/14",
        "13.89.0.0/15",
      ];

      return azureRanges.map((cidr) => ({
        cidr: cidr,
        provider: "Azure",
        service: "Public Cloud",
        region: "global",
      }));
    },
  },
  {
    name: "Cloudflare",
    url: "https://api.cloudflare.com/client/v4/ips",
    parse: (data) => {
      const ranges = [];
      if (data && data.success && data.result) {
        const ipv4Cidrs = data.result.ipv4_cidrs || [];
        const ipv6Cidrs = data.result.ipv6_cidrs || [];

        ranges.push(
          ...ipv4Cidrs.map((cidr) => ({
            cidr,
            provider: "Cloudflare",
          })),
          ...ipv6Cidrs.map((cidr) => ({
            cidr,
            provider: "Cloudflare",
          }))
        );
      }
      return ranges;
    },
  },
  // Temporarily disabled - API endpoint changed
  // {
  //   name: "DigitalOcean",
  //   url: "https://www.digitalocean.com/geo/digitalocean.ranges.json",
  //   ...
  // },
  {
    name: "Oracle Cloud",
    url: "https://docs.oracle.com/en-us/iaas/tools/public_ip_ranges.json",
    parse: (data) =>
      data.regions.flatMap((r) =>
        r.cidrs.map((c) => ({
          cidr: c.cidr,
          provider: "Oracle Cloud",
          region: r.region,
        }))
      ),
  },
  {
    name: "Linode",
    url: "https://geoip.linode.com/",
    parse: (text) =>
      text
        .trim()
        .split("\n")
        .map((line) => {
          const [cidr] = line.split("|");
          return { cidr, provider: "Linode" };
        }),
  },
  // Temporarily disabled - API structure changed
  // {
  //   name: "OVH",
  //   url: "https://api.ipv4.ovh/v1/networks",
  //   ...
  // },
];

async function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: { "User-Agent": "penpal-autorecon/1.0" },
          timeout: 10000,
        },
        (res) => {
          let data = "";
          res.on("data", (c) => (data += c));
          res.on("end", () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(new Error(`Invalid JSON from ${url}: ${e.message}`));
            }
          });
        }
      )
      .on("error", reject)
      .on("timeout", () => {
        reject(new Error(`Timeout fetching ${url}`));
      });
  });
}

async function fetchText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: { "User-Agent": "penpal-autorecon/1.0" },
          timeout: 10000,
        },
        (res) => {
          let data = "";
          res.on("data", (c) => (data += c));
          res.on("end", () => resolve(data));
        }
      )
      .on("error", reject)
      .on("timeout", () => {
        reject(new Error(`Timeout fetching ${url}`));
      });
  });
}

async function updateRanges(passedLogger) {
  // Use passed logger if available
  if (passedLogger) {
    logger = passedLogger;
  }

  logger.log("Downloading latest cloud IP ranges...");
  const allRanges = [];

  for (const src of SOURCES) {
    try {
      let url = src.url;
      if (src.directUrl) url = await src.directUrl();
      if (!url) throw new Error("Failed to get direct URL");

      logger.log(`  → ${src.name}`);
      const raw = await (url.endsWith(".json") || url.includes(".json")
        ? fetchJSON(url)
        : fetchText(url));
      const parsed = src.parse(raw);
      allRanges.push(...parsed);
    } catch (e) {
      logger.warn(`  ✗ ${src.name}: ${e.message}`);
    }
  }

  const result = {
    generatedAt: new Date().toISOString(),
    totalRanges: allRanges.length,
    ranges: allRanges,
  };

  fs.writeFileSync(CACHE_FILE, JSON.stringify(result, null, 2));
  logger.log(
    `Done! ${allRanges.length.toLocaleString()} CIDR ranges saved to ${CACHE_FILE}`
  );
  return result;
}

function loadCached() {
  if (!fs.existsSync(CACHE_FILE)) return null;
  const stat = fs.statSync(CACHE_FILE);
  const age = Date.now() - stat.mtimeMs;
  if (age > CACHE_DURATION) return null;

  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
  } catch {
    return null;
  }
}

async function getCloudRanges(forceRefresh = false) {
  if (!forceRefresh) {
    const cached = loadCached();
    if (cached) return cached;
  }
  return await updateRanges();
}

// Simple CIDR matching (no external dependencies)
function ipToNumber(ip) {
  return (
    ip.split(".").reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0
  );
}

function isIpInCidr(ip, cidr) {
  const [network, prefix] = cidr.split("/");
  const ipNum = ipToNumber(ip);
  const networkNum = ipToNumber(network);
  const mask = (0xffffffff << (32 - parseInt(prefix))) >>> 0;
  return (ipNum & mask) === (networkNum & mask);
}

async function getProviderForIp(ip) {
  const data = await getCloudRanges();
  for (const range of data.ranges) {
    if (isIpInCidr(ip, range.cidr)) {
      return range;
    }
  }
  return null;
}

// CLI interface
if (process.argv.includes("--update") || process.argv.includes("-u")) {
  updateRanges().catch((error) => logger.error(error.message));
} else if (process.argv[2] === "--check" && process.argv[3]) {
  (async () => {
    const info = await getProviderForIp(process.argv[3]);
    logger.log(info || "Not a known cloud IP");
  })();
}

export { getCloudRanges, getProviderForIp, updateRanges };
