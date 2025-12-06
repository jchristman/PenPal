import PenPal from "#penpal/core";

// Import the shared logger from plugin.ts
import { TesterLogger as logger } from "../plugin.ts";

interface TestHandler {
  id: string;
  plugin_name: string;
  handler_name: string;
  function_handler: (...args: any[]) => Promise<any>;
  args_schema: any[];
  registered_at: string;
}

interface TestResult {
  success: boolean;
  message?: string;
  error?: string;
  timestamp: string;
  [key: string]: any;
}

// In-memory storage for registered handlers (could be moved to DataStore if persistence is needed)
const registeredHandlers = new Map();
let handlerIdCounter = 1;

/**
 * Register a test handler function with metadata
 * @param {string} plugin_name - Name of the plugin registering the handler
 * @param {Function} function_handler - The function to be called when testing
 * @param {Array} args_schema - Array of argument definitions with types
 * @param {string} handler_name - Optional name for the handler (defaults to function name)
 * @returns {string} - Handler ID
 */
export const registerHandler = (
  plugin_name: string,
  function_handler: (...args: any[]) => Promise<any>,
  args_schema: any[] = [],
  handler_name: string | null = null
): string => {
  const handler_id = `tester_handler_${handlerIdCounter++}`;
  const name = handler_name || function_handler.name || `Handler_${handler_id}`;

  const handler_info = {
    id: handler_id,
    plugin_name,
    handler_name: name,
    function_handler,
    args_schema,
    registered_at: new Date().toISOString(),
  };

  registeredHandlers.set(handler_id, handler_info);

  logger.info(`Registered handler: ${plugin_name}.${name}`);
  return handler_id;
};

/**
 * Get all registered handlers (without the actual functions for GraphQL)
 */
export const getRegisteredHandlers = (): any[] => {
  return Array.from(registeredHandlers.values()).map((handler) => ({
    id: handler.id,
    plugin_name: handler.plugin_name,
    handler_name: handler.handler_name,
    args_schema: handler.args_schema,
    registered_at: handler.registered_at,
  }));
};

/**
 * Get a specific handler by ID
 */
export const getHandler = (handler_id: string): TestHandler | null => {
  return registeredHandlers.get(handler_id);
};

/**
 * Invoke a registered handler with provided arguments
 * @param {string} handler_id - ID of the handler to invoke
 * @param {Array} args - Arguments to pass to the handler
 * @returns {Object} - Result of the handler execution
 */
export const invokeHandler = async (handler_id: string, args: any[] = []): Promise<TestResult> => {
  const handler_info = registeredHandlers.get(handler_id);

  if (!handler_info) {
    throw new Error(`Handler with ID ${handler_id} not found`);
  }

  try {
    logger.info(
      `Invoking handler: ${handler_info.plugin_name}.${handler_info.handler_name}`
    );
    logger.info(`Arguments:`, args);

    const start_time = Date.now();
    const result = await handler_info.function_handler(...args);
    const execution_time = Date.now() - start_time;

    logger.info(`Handler completed in ${execution_time}ms`);

    return {
      success: true,
      result,
      execution_time,
      invoked_at: new Date().toISOString(),
    };
  } catch (error) {
    logger.error(`Handler execution failed:`, error);

    return {
      success: false,
      error: error.message,
      stack: error.stack,
      invoked_at: new Date().toISOString(),
    };
  }
};

/**
 * Remove a registered handler
 */
export const unregisterHandler = (handler_id: string): boolean => {
  const handler_info = registeredHandlers.get(handler_id);
  if (handler_info) {
    registeredHandlers.delete(handler_id);
    logger.info(
      `Unregistered handler: ${handler_info.plugin_name}.${handler_info.handler_name}`
    );
    return true;
  }
  return false;
};

/**
 * Clear all handlers for a specific plugin
 */
export const clearPluginHandlers = (plugin_name: string): number => {
  const cleared = [];
  for (const [handler_id, handler_info] of registeredHandlers.entries()) {
    if (handler_info.plugin_name === plugin_name) {
      registeredHandlers.delete(handler_id);
      cleared.push(handler_info);
    }
  }
  logger.info(
    `Cleared ${cleared.length} handlers for plugin: ${plugin_name}`
  );
  return cleared;
};
