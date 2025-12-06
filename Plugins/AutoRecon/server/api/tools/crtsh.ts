import { exec } from "child_process";
import { promisify } from "util";
import { AutoReconLogger as logger } from "../../plugin.ts";

const execAsync = promisify(exec);

// CRT.sh certificate transparency subdomain enumeration
export const runCrtshScan = async (domain: string): Promise<string[]> => {
  try {
    logger.log(`Running crt.sh scan for ${domain}`);

    // Use curl to query crt.sh API
    const result = await execAsync(
      `curl -s "https://crt.sh/?q=%.${domain}&output=json"`
    );

    logger.log(`CRT.sh curl result: stdout length=${result.stdout?.length || 0}, stderr="${result.stderr || ''}"`);

    if (!result.stdout || result.stdout.trim().length === 0) {
      logger.log(`CRT.sh returned empty result for ${domain}`);
      return [];
    }

    let certificates;
    try {
      certificates = JSON.parse(result.stdout);
      logger.log(`CRT.sh parsed ${certificates.length} certificates for ${domain}`);
    } catch (parseError: any) {
      logger.error(`CRT.sh JSON parse failed for ${domain}:`, parseError.message);
      return [];
    }

    const domains = new Set<string>();

    for (const cert of certificates) {
      if (cert.name_value) {
        // Clean up wildcard entries and split on newlines (some entries contain multiple domains)
        const rawDomains = cert.name_value.replace(/^\*\./, "").split('\n');

        for (const rawDomain of rawDomains) {
          const cleanDomain = rawDomain.trim().toLowerCase();
          if (cleanDomain && cleanDomain.includes(domain.toLowerCase())) {
            logger.log(`CRT.sh adding domain: ${cleanDomain}`);
          domains.add(cleanDomain);
          }
        }
      }
    }

    logger.log(`crt.sh found ${domains.size} domains for ${domain}:`, Array.from(domains));
    return Array.from(domains);
  } catch (error: any) {
    logger.error(`crt.sh scan failed for ${domain}:`, error);
    return [];
  }
};
