/**
 * Simple health check utility for the GraphQL server
 */

interface HealthCheckResult {
  healthy: boolean;
  status: string;
  details: string;
}

const GRAPHQL_ENDPOINT = "http://localhost:3001/graphql";

export const checkServerHealth = async (): Promise<HealthCheckResult> => {
  try {
    // Try a simple fetch to the GraphQL endpoint with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: "{ __typename }",
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return {
        healthy: true,
        status: "Server is responding",
        details: `HTTP ${response.status}`,
      };
    } else {
      return {
        healthy: false,
        status: "Server responded with error",
        details: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return {
          healthy: false,
          status: "Server response timeout",
          details: "Request took longer than 5 seconds",
        };
      }

      if (error.message.includes("Failed to fetch")) {
        return {
          healthy: false,
          status: "Cannot reach server",
          details: "Server may not be running or network is down",
        };
      }

      return {
        healthy: false,
        status: "Connection error",
        details: error.message,
      };
    }

    return {
      healthy: false,
      status: "Connection error",
      details: "Unknown error occurred",
    };
  }
};

export const waitForServerHealth = async (
  maxAttempts: number = 30,
  intervalMs: number = 2000,
  onProgress: ((message: string) => void) | null = null
): Promise<HealthCheckResult> => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    onProgress?.(`Checking server health (${attempt}/${maxAttempts})...`);

    const health = await checkServerHealth();

    if (health.healthy) {
      onProgress?.("Server is healthy and ready!");
      return health;
    }

    onProgress?.(`Server not ready: ${health.status}`);

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  throw new Error("Server failed to become healthy within the timeout period");
};
