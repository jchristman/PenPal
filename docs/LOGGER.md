# PenPal Centralized Logger System

PenPal provides a sophisticated centralized logging system that automatically assigns unique colors to each plugin and ensures consistent formatting across the entire platform.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Implementation Guide](#implementation-guide)
- [Migration from Console.log](#migration-from-consolelog)
- [API Reference](#api-reference)
- [Best Practices](#best-practices)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

## Overview

The PenPal logger system replaces manual console.log statements with a centralized, color-coded logging solution. Each plugin automatically gets a unique color, and all log messages are consistently formatted with timestamps and plugin identification.

### Before and After

**Before (Manual Console Logging):**

```javascript
console.log("[HttpX] Starting HTTP scan for 25 targets");
console.error("[HttpX] Scan failed: Connection timeout");
console.log("[+] HttpX scan completed successfully");
```

**After (Centralized Logger):**

```javascript
logger.log("Starting HTTP scan for 25 targets");
logger.error("Scan failed: Connection timeout");
logger.log("Scan completed successfully");
```

**Output:**

```
2024-01-15T10:30:45.123Z [HttpX] Starting HTTP scan for 25 targets
2024-01-15T10:30:46.456Z [HttpX] Scan failed: Connection timeout
2024-01-15T10:30:47.789Z [HttpX] Scan completed successfully
```

## Features

### 🎨 Automatic Color Assignment

- **Unique Colors**: Each plugin gets a consistent color based on plugin name hash
- **12 ANSI Colors**: Cyan, green, yellow, blue, magenta, red, white, gray, and bright variants
- **Persistent**: Same plugin always gets the same color across server restarts

### 📝 Consistent Formatting

- **Timestamps**: ISO 8601 format timestamps on every message
- **Plugin Prefixes**: Automatic `[PluginName]` prefixes in assigned colors
- **Multiple Log Levels**: log, info, warn, error, debug with appropriate colors

### 🔧 Easy Integration

- **File-Level Exports**: Create once, import anywhere within plugin
- **Drop-in Replacement**: Simple migration from console.log statements
- **No Performance Impact**: Fast, synchronous logging calls

## Quick Start

### 1. Create Logger Export

In your plugin's main `plugin.js` file:

```javascript
import PenPal from "#penpal/core";

// File-level logger that can be imported by other files
export const YourPluginLogger = PenPal.Utils.BuildLogger("YourPlugin");

const YourPlugin = {
  async loadPlugin() {
    YourPluginLogger.log("Plugin loading started");
    // ... plugin code
    return { settings };
  },
};

export default YourPlugin;
```

### 2. Import in Other Files

In API files, utilities, or other plugin modules:

```javascript
import { YourPluginLogger as logger } from "./plugin.js";

export const performOperation = async () => {
  logger.log("Starting operation");

  try {
    // Your operation logic
    logger.info("Operation completed successfully");
  } catch (error) {
    logger.error("Operation failed:", error.message);
  }
};
```

### 3. Replace Console Statements

```javascript
// ❌ Replace these patterns
console.log("[YourPlugin] Message");
console.error("[YourPlugin] Error:", error);
console.log("[+] Success message");

// ✅ With logger methods
logger.log("Message");
logger.error("Error:", error);
logger.log("Success message");
```

## Implementation Guide

### Step-by-Step Migration

#### Step 1: Add Logger Export

Add to the top of your plugin's `plugin.js` file:

```javascript
// File-level logger that can be imported by other files
export const YourPluginLogger = PenPal.Utils.BuildLogger("YourPlugin");
```

#### Step 2: Replace Instance Properties

If your plugin currently uses instance-based loggers:

```javascript
// ❌ Remove instance-based logger
const YourPlugin = {
  logger: null, // Remove this

  async loadPlugin() {
    this.logger = PenPal.Utils.BuildLogger("YourPlugin"); // Remove this
    // ...
  },
};

// ✅ Use file-level export instead
export const YourPluginLogger = PenPal.Utils.BuildLogger("YourPlugin");

const YourPlugin = {
  async loadPlugin() {
    YourPluginLogger.log("Plugin loading started");
    // ...
  },
};
```

#### Step 3: Update Method Calls

Replace all logger references:

```bash
# Use sed to replace instance references
sed -i '' 's/this\.logger/YourPluginLogger/g' Plugins/YourPlugin/server/plugin.js
```

#### Step 4: Import in Other Files

Update all plugin files to import the shared logger:

```javascript
// At the top of each file that needs logging
import { YourPluginLogger as logger } from "./plugin.js";
// or for nested files:
import { YourPluginLogger as logger } from "../plugin.js";
```

#### Step 5: Remove Manual Prefixes

Remove plugin name prefixes since the logger handles them automatically:

```bash
# Remove common prefix patterns
sed -i '' 's/\[YourPlugin\] //g' Plugins/YourPlugin/server/**/*.js
sed -i '' 's/\[+\] //g' Plugins/YourPlugin/server/**/*.js
sed -i '' 's/\[.\] //g' Plugins/YourPlugin/server/**/*.js
```

### File Organization Pattern

```
Plugins/YourPlugin/server/
├── plugin.js              # Exports: YourPluginLogger
├── api/
│   ├── index.js           # Imports: { YourPluginLogger as logger }
│   └── operations.js      # Imports: { YourPluginLogger as logger }
├── utils/
│   └── helpers.js         # Imports: { YourPluginLogger as logger }
└── graphql/
    └── resolvers/
        └── queries.js     # Imports: { YourPluginLogger as logger }
```

## Migration from Console.log

### Common Console.log Patterns

#### Pattern 1: Plugin Name Prefixes

```javascript
// ❌ Before
console.log("[HttpX] Starting scan");
console.error("[HttpX] Error occurred:", error);

// ✅ After
logger.log("Starting scan");
logger.error("Error occurred:", error);
```

#### Pattern 2: Status Prefixes

```javascript
// ❌ Before
console.log("[+] Operation successful");
console.log("[.] Processing...");
console.log("[!] Warning message");

// ✅ After
logger.log("Operation successful");
logger.info("Processing...");
logger.warn("Warning message");
```

#### Pattern 3: Mixed Console Methods

```javascript
// ❌ Before
console.log("[Plugin] Info message");
console.warn("[Plugin] Warning message");
console.error("[Plugin] Error message");

// ✅ After
logger.info("Info message");
logger.warn("Warning message");
logger.error("Error message");
```

### Automated Migration Script

Create a migration script for bulk updates:

```bash
#!/bin/bash
# migrate-logger.sh

PLUGIN_NAME=$1
PLUGIN_DIR="Plugins/$PLUGIN_NAME/server"

if [ -z "$PLUGIN_NAME" ]; then
  echo "Usage: ./migrate-logger.sh PluginName"
  exit 1
fi

echo "Migrating $PLUGIN_NAME to use centralized logger..."

# Add logger export to plugin.js
sed -i '' "s/import PenPal from \"#penpal\/core\";/import PenPal from \"#penpal\/core\";\n\n\/\/ File-level logger that can be imported by other files\nexport const ${PLUGIN_NAME}Logger = PenPal.Utils.BuildLogger(\"$PLUGIN_NAME\");/" "$PLUGIN_DIR/plugin.js"

# Replace console.log statements
find "$PLUGIN_DIR" -name "*.js" -exec sed -i '' "s/console\.log/logger.log/g" {} \;
find "$PLUGIN_DIR" -name "*.js" -exec sed -i '' "s/console\.error/logger.error/g" {} \;
find "$PLUGIN_DIR" -name "*.js" -exec sed -i '' "s/console\.warn/logger.warn/g" {} \;
find "$PLUGIN_DIR" -name "*.js" -exec sed -i '' "s/console\.info/logger.info/g" {} \;

# Remove plugin name prefixes
find "$PLUGIN_DIR" -name "*.js" -exec sed -i '' "s/\[$PLUGIN_NAME\] //g" {} \;
find "$PLUGIN_DIR" -name "*.js" -exec sed -i '' "s/\[+\] //g" {} \;
find "$PLUGIN_DIR" -name "*.js" -exec sed -i '' "s/\[.\] //g" {} \;
find "$PLUGIN_DIR" -name "*.js" -exec sed -i '' "s/\[!\] //g" {} \;

echo "Migration completed! Remember to:"
echo "1. Add logger imports to files that need them"
echo "2. Test the plugin to ensure it works correctly"
echo "3. Review any remaining console statements"
```

## API Reference

### PenPal.Utils.BuildLogger(plugin_name)

Creates a new logger instance for the specified plugin.

**Parameters:**

- `plugin_name` (string): Name of the plugin (used for color assignment and prefixing)

**Returns:**

- Logger object with methods: `log`, `info`, `warn`, `error`, `debug`

**Example:**

```javascript
const logger = PenPal.Utils.BuildLogger("MyPlugin");
```

### Logger Methods

#### logger.log(...args)

General purpose logging with default color. Accepts any number of arguments like `console.log`.

```javascript
logger.log("Operation completed");
logger.log("Processed", count, "items");
logger.log("Complex object:", { data: obj, status: "ready" });
```

#### logger.info(...args)

Informational messages (cyan color). Accepts any number of arguments like `console.info`.

```javascript
logger.info("Configuration loaded");
logger.info("Server started on port", port);
logger.info("Config details:", configObject);
```

#### logger.warn(...args)

Warning messages (yellow color). Accepts any number of arguments like `console.warn`.

```javascript
logger.warn("Deprecated API used");
logger.warn("Rate limit approaching:", currentRate);
logger.warn("Warning details:", errorObject, additionalContext);
```

#### logger.error(...args)

Error messages (red color). Accepts any number of arguments like `console.error`.

```javascript
logger.error("Connection failed");
logger.error("Operation failed:", error.message);
logger.error("Error details:", error.stack, { context: data });
```

#### logger.debug(...args)

Debug information (gray color). Accepts any number of arguments like `console.debug`.

```javascript
logger.debug("Variable state:", obj);
logger.debug("Processing step", step, "of", total);
logger.debug("Debug info:", complexObject, metadata);
```

## Best Practices

### Log Level Usage

- **`logger.log()`**: General operational messages, progress updates
- **`logger.info()`**: Configuration, startup information, milestones
- **`logger.warn()`**: Non-critical issues, deprecation notices, rate limits
- **`logger.error()`**: Failures, exceptions, critical issues
- **`logger.debug()`**: Detailed troubleshooting, variable dumps, trace information

### Message Content Guidelines

#### ✅ Good Practices

```javascript
// Clear, descriptive messages
logger.log("Starting HTTP scan for 25 targets");
logger.info("Docker image built successfully: penpal:httpx");
logger.warn("API rate limit exceeded, retrying in 60s");
logger.error("Database connection failed: timeout after 30s");

// Include relevant context
logger.log("Processed batch", batchId, "with", itemCount, "items");
logger.error("Service discovery failed for host:", hostId, error.message);
```

#### ❌ Avoid These Patterns

```javascript
// Don't include plugin names (logger handles this)
logger.log("[HttpX] Starting scan"); // Remove [HttpX]

// Don't use unclear messages
logger.log("Done"); // What is done?
logger.error("Failed"); // What failed and why?

// Don't log sensitive information
logger.log("Password:", password); // Security risk
logger.debug("API key:", apiKey); // Security risk
```

### File Organization

#### Main Plugin File

```javascript
// plugin.js
import PenPal from "#penpal/core";

// Export logger for use by other plugin files
export const YourPluginLogger = PenPal.Utils.BuildLogger("YourPlugin");

const YourPlugin = {
  async loadPlugin() {
    YourPluginLogger.log("Plugin loading started");
    // Plugin code
    return { settings };
  },
};

export default YourPlugin;
```

#### API Files

```javascript
// api/index.js
import PenPal from "#penpal/core";
import { YourPluginLogger as logger } from "../plugin.js";

export const performOperation = async () => {
  logger.log("Starting operation");
  // Operation code
};
```

#### Nested Files

```javascript
// graphql/resolvers/queries.js
import PenPal from "#penpal/core";
import { YourPluginLogger as logger } from "../../plugin.js";

export default {
  getItems: async () => {
    logger.log("Fetching items");
    // Resolver code
  },
};
```

## Examples

### Complete Plugin Example

```javascript
// Plugins/ExampleTool/server/plugin.js
import { loadGraphQLFiles, resolvers } from "./graphql/index.js";
import * as API from "./api/index.js";
import PenPal from "#penpal/core";

// File-level logger that can be imported by other files
export const ExampleToolLogger = PenPal.Utils.BuildLogger("ExampleTool");

const ExampleToolPlugin = {
  async loadPlugin() {
    ExampleToolLogger.log("Plugin loading started");

    // Register API methods
    PenPal.ExampleTool = {
      Scan: API.performScan,
      Parse: API.parseResults,
    };

    // MQTT subscription
    const MQTT = await PenPal.MQTT.NewClient();
    await MQTT.Subscribe(
      PenPal.API.MQTT.Topics.New.Services,
      async ({ project, service_ids }) => {
        ExampleToolLogger.log("Received", service_ids.length, "new services");
        await API.processBatch(project, service_ids);
      }
    );

    ExampleToolLogger.log("Plugin loaded successfully");
    return {
      graphql: { types: loadGraphQLFiles, resolvers },
      settings: {
        docker: {
          name: "penpal:exampletool",
          dockercontext: `${__dirname}/docker-context`,
        },
      },
    };
  },
};

export default ExampleToolPlugin;
```

```javascript
// Plugins/ExampleTool/server/api/index.js
import PenPal from "#penpal/core";
import fs from "fs";
import path from "path";

// Import the shared logger from plugin.js
import { ExampleToolLogger as logger } from "../plugin.js";

export const performScan = async (targets) => {
  logger.log("Starting scan for", targets.length, "targets");

  try {
    // Create job for tracking
    const job = await PenPal.Jobs.Create({
      name: `ExampleTool Scan (${targets.length} targets)`,
      statusText: "Preparing scan",
      progress: 0,
    });

    logger.info("Created job:", job.id);

    // Perform scan
    await PenPal.Jobs.UpdateProgress(job.id, 50);
    const results = await executeScan(targets);

    await PenPal.Jobs.Update(job.id, {
      progress: 100,
      status: "done",
      statusText: "Scan completed successfully",
    });

    logger.log("Scan completed successfully, found", results.length, "results");
    return results;
  } catch (error) {
    logger.error("Scan failed:", error.message);
    throw error;
  }
};

export const parseResults = async (outputData) => {
  logger.log("Parsing tool output");

  try {
    const results = JSON.parse(outputData);
    logger.info("Parsed", results.length, "results from tool output");
    return results;
  } catch (error) {
    logger.error("Failed to parse tool output:", error.message);
    return [];
  }
};

const executeScan = async (targets) => {
  logger.debug("Executing scan with targets:", targets);

  // Create input file
  const inputFile = `/tmp/targets-${Date.now()}.txt`;
  fs.writeFileSync(inputFile, targets.join("\n"));

  // Run containerized tool
  const result = await PenPal.Docker.Run({
    image: "penpal:exampletool",
    cmd: `scan -i ${inputFile} -o /tmp/results.json`,
    daemonize: true,
  });

  logger.debug("Container started:", result.stdout.trim());

  // Wait for completion
  await PenPal.Docker.Wait(result.stdout.trim());

  // Read results
  const results = fs.readFileSync("/tmp/results.json", "utf8");
  return JSON.parse(results);
};
```

### Error Handling Example

```javascript
import { ExampleToolLogger as logger } from "../plugin.js";

export const robustOperation = async (data) => {
  logger.log("Starting robust operation with", data.length, "items");

  const results = [];
  const errors = [];

  for (let i = 0; i < data.length; i++) {
    try {
      logger.debug("Processing item", i + 1, "of", data.length);
      const result = await processItem(data[i]);
      results.push(result);

      if ((i + 1) % 10 === 0) {
        logger.info("Processed", i + 1, "items so far");
      }
    } catch (error) {
      logger.warn("Failed to process item", i + 1, ":", error.message);
      errors.push({ index: i, error: error.message });
    }
  }

  if (errors.length > 0) {
    logger.warn("Operation completed with", errors.length, "errors");
    logger.debug("Error details:", errors);
  } else {
    logger.log("Operation completed successfully");
  }

  return { results, errors };
};
```

## Troubleshooting

### Common Issues

#### Issue 1: Logger Not Defined

```
ReferenceError: logger is not defined
```

**Solution:** Import the logger in the file where you're using it:

```javascript
import { YourPluginLogger as logger } from "./plugin.js";
```

#### Issue 2: Circular Import

```
Error: Cannot import before initialization
```

**Solution:** Make sure the logger export is at the top level of plugin.js, not inside functions:

```javascript
// ✅ Correct - top level export
export const YourPluginLogger = PenPal.Utils.BuildLogger("YourPlugin");

// ❌ Wrong - inside function
const YourPlugin = {
  loadPlugin() {
    export const YourPluginLogger = PenPal.Utils.BuildLogger("YourPlugin");
  },
};
```

#### Issue 3: Wrong Import Path

```
Error: Module not found
```

**Solution:** Check the relative path to plugin.js:

```javascript
// From same directory
import { YourPluginLogger as logger } from "./plugin.js";

// From subdirectory (api/, graphql/, etc.)
import { YourPluginLogger as logger } from "../plugin.js";

// From nested subdirectory
import { YourPluginLogger as logger } from "../../plugin.js";
```

#### Issue 4: Console Statements Still Present

```
penpal-server-1  | [YourPlugin] Message appears without color
```

**Solution:** Make sure you've replaced all console statements:

```bash
# Check for remaining console statements
grep -r "console\." Plugins/YourPlugin/server/

# Replace them with logger calls
sed -i '' 's/console\.log/logger.log/g' file.js
```

### Debugging Tips

#### Check Logger Export

Verify the logger is properly exported:

```javascript
// In plugin.js
console.log("Logger exported:", typeof YourPluginLogger); // Should be "object"
```

#### Verify Import

Check that the import is working:

```javascript
// In other files
import { YourPluginLogger as logger } from "./plugin.js";
console.log("Logger imported:", typeof logger); // Should be "object"
```

#### Test Logger Methods

Verify all logger methods work:

```javascript
logger.log("Test log message");
logger.info("Test info message");
logger.warn("Test warn message");
logger.error("Test error message");
logger.debug("Test debug message");
```

### Performance Considerations

- Logger calls are synchronous and very fast
- No need to conditionally disable logging in production
- Color codes add minimal overhead to message formatting
- File I/O is not involved (direct console output)

## Conclusion

The PenPal centralized logger system provides a professional, consistent logging experience across all plugins. By following the patterns and best practices outlined in this guide, you can ensure your plugin integrates seamlessly with the PenPal logging infrastructure.

For questions or issues not covered in this guide, refer to the plugin system documentation or examine existing plugin implementations for reference patterns.
