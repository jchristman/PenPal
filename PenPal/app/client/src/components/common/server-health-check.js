/**
 * Simple health check utility for the GraphQL server
 */

const GRAPHQL_ENDPOINT = "http://localhost:3001/graphql";

export const checkServerHealth = async () => {
  try {
    // Try a simple fetch to the GraphQL endpoint
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: "{ __typename }",
      }),
      timeout: 5000, // 5 second timeout
    });

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
};

export const waitForServerHealth = async (
  maxAttempts = 30,
  intervalMs = 2000,
  onProgress = null
) => {
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
