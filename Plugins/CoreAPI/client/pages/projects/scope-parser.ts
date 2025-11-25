import { Regex } from "@penpal/core";

/**
 * Parses a string containing IPs, CIDR networks, and domain names
 * Supports comma, space, or newline-separated values
 * 
 * @param {string} input - The input string to parse
 * @returns {Object} - Object containing arrays of IPs, networks, and domains
 */
export const parseScopeInput = (input: string): { ips: string[]; networks: string[]; domains: string[] } => {
  if (!input || typeof input !== "string") {
    return { ips: [], networks: [], domains: [] };
  }

  // Split by comma, space, or newline, then trim and filter empty strings
  const items = input
    .split(/[,\s\n]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  const ips = [];
  const networks = [];
  const domains = [];

  for (const item of items) {
    // Check if it's a CIDR network (e.g., 192.168.1.0/24)
    const cidrMatch = item.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(\d{1,2})$/);
    if (cidrMatch) {
      const [, ip, mask] = cidrMatch;
      const maskNum = parseInt(mask, 10);
      // Validate IP and mask
      if (Regex.ip_address.test(ip) && maskNum >= 0 && maskNum <= 32) {
        networks.push(`${ip}/${mask}`);
        continue;
      }
    }

    // Check if it's an IP address
    if (Regex.ip_address.test(item)) {
      ips.push(item);
      continue;
    }

    // Check if it looks like a domain name
    // Domain regex: allows letters, numbers, dots, hyphens
    // Must have at least one dot and valid TLD-like ending
    const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (domainRegex.test(item)) {
      domains.push(item.toLowerCase());
      continue;
    }

    // If it doesn't match any pattern, skip it (could add warning/error handling)
  }

  return { ips, networks, domains };
};

/**
 * Validates if a string is a valid domain name
 * @param {string} domain - Domain name to validate
 * @returns {boolean}
 */
export const isValidDomain = (domain: string): boolean => {
  if (!domain || typeof domain !== "string") return false;
  const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  return domainRegex.test(domain);
};

/**
 * Validates if a string is a valid CIDR network
 * @param {string} cidr - CIDR notation (e.g., "192.168.1.0/24")
 * @returns {boolean}
 */
export const isValidCIDR = (cidr: string): boolean => {
  if (!cidr || typeof cidr !== "string") return false;
  const cidrMatch = cidr.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(\d{1,2})$/);
  if (!cidrMatch) return false;
  const [, ip, mask] = cidrMatch;
  const maskNum = parseInt(mask, 10);
  return Regex.ip_address.test(ip) && maskNum >= 0 && maskNum <= 32;
};

