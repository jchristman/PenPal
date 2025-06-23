# Tester Plugin

The Tester plugin provides a comprehensive testing framework for PenPal plugins, allowing developers to register test handlers and execute them through a polished web interface.

## Features

- **Test Handler Registration**: Plugins can register test functions with argument schemas
- **Web Interface**: Polished UI at `/plugin-tester` to view and execute tests
- **Argument Validation**: Type-safe argument handling with validation
- **Real-time Results**: Immediate feedback on test execution with detailed results
- **Error Handling**: Comprehensive error reporting with stack traces
- **Plugin Grouping**: Tests are organized by plugin for easy navigation

## API Usage

### Registering Test Handlers

Use the `PenPal.Tester.RegisterHandler()` function to register test handlers:

```javascript
// Simple test handler with no arguments
PenPal.Tester.RegisterHandler(
  "YourPlugin",
  async () => {
    // Your test logic here
    return { message: "Test passed!" };
  },
  [],
  "Simple Test"
);

// Test handler with arguments
PenPal.Tester.RegisterHandler(
  "YourPlugin",
  async (username, age, isActive) => {
    // Your test logic with arguments
    return {
      created_user: {
        username,
        age,
        isActive,
        created_at: new Date().toISOString(),
      },
    };
  },
  [
    {
      name: "username",
      type: "string",
      required: true,
      description: "Username for the user",
    },
    {
      name: "age",
      type: "number",
      required: true,
      description: "Age of the user",
    },
    {
      name: "isActive",
      type: "boolean",
      required: false,
      description: "Whether the user is active",
    },
  ],
  "Create User Test"
);
```

### API Function Signature

```javascript
PenPal.Tester.RegisterHandler(
  plugin_name,
  function_handler,
  args_schema,
  handler_name
);
```

**Parameters:**

- `plugin_name` (string): Name of the plugin registering the handler
- `function_handler` (function): The test function to execute
- `args_schema` (array): Array of argument definitions
- `handler_name` (string, optional): Custom name for the handler

**Argument Schema Format:**

```javascript
{
  name: "argumentName",           // Name of the argument
  type: "string|number|boolean|array|object|json",  // Type of the argument
  required: true|false,           // Whether the argument is required
  description: "Description..."   // Help text for the argument
}
```

## Supported Argument Types

- **string/text**: Text input fields
- **number/integer**: Numeric input fields
- **boolean**: True/false dropdown
- **array/object/json**: Multi-line JSON input with validation

## Example Integration

Here's how the CoreAPI plugin registers test handlers:

```javascript
// In your plugin's loadPlugin() function
if (PenPal.Tester) {
  // API Statistics test
  PenPal.Tester.RegisterHandler(
    "CoreAPI",
    async () => {
      const projects = await API.getProjects();
      const hosts = await API.getHosts();
      const services = await API.getServices();

      return {
        total_projects: projects.length,
        total_hosts: hosts.length,
        total_services: services.length,
        timestamp: new Date().toISOString(),
      };
    },
    [],
    "API Statistics"
  );

  // Database connectivity test
  PenPal.Tester.RegisterHandler(
    "CoreAPI",
    async () => {
      try {
        await API.getProjects();
        return {
          database_connected: true,
          message: "Database connectivity test passed",
        };
      } catch (error) {
        return {
          database_connected: false,
          error: error.message,
        };
      }
    },
    [],
    "Database Connectivity Test"
  );
}
```

## User Interface

Navigate to `/plugin-tester` to access the testing interface. The UI provides:

- **Plugin Grouping**: Tests organized by plugin name
- **Handler Cards**: Each test handler displayed in a card with metadata
- **Argument Forms**: Dynamic form generation based on argument schemas
- **Execution Controls**: Execute button with loading indicators
- **Result Display**: Color-coded success/failure indicators
- **Detailed Output**: JSON-formatted results and error messages
- **Performance Metrics**: Execution time tracking

## Advanced Features

### Additional API Methods

```javascript
// Get all registered handlers
const handlers = PenPal.Tester.GetHandlers();

// Get specific handler
const handler = PenPal.Tester.GetHandler(handler_id);

// Invoke handler programmatically
const result = await PenPal.Tester.InvokeHandler(handler_id, [arg1, arg2]);

// Remove handler
PenPal.Tester.UnregisterHandler(handler_id);

// Clear all handlers for a plugin
PenPal.Tester.ClearPluginHandlers("PluginName");
```

### GraphQL Operations

The plugin exposes GraphQL queries and mutations:

```graphql
# Get all test handlers
query {
  getTestHandlers {
    id
    plugin_name
    handler_name
    args_schema {
      name
      type
      required
      description
    }
    registered_at
  }
}

# Invoke a test handler
mutation {
  invokeTestHandler(handler_id: "handler-id", args: ["arg1", "arg2"]) {
    success
    result
    error
    execution_time
    invoked_at
  }
}
```

## Best Practices

1. **Descriptive Names**: Use clear, descriptive names for test handlers
2. **Error Handling**: Include proper error handling in test functions
3. **Return Meaningful Data**: Return structured data that's useful for validation
4. **Argument Validation**: Use appropriate types and descriptions for arguments
5. **Plugin Namespacing**: Use your plugin name consistently for organization

## Testing Workflow

1. **Register Handlers**: Add test handlers to your plugin's `loadPlugin()` function
2. **Navigate to UI**: Go to `/plugin-tester` in the PenPal interface
3. **Select Plugin**: Find your plugin's test handlers
4. **Fill Arguments**: Complete any required argument forms
5. **Execute Tests**: Click the Execute button
6. **Review Results**: Check the output for success/failure status

## Dependencies

The Tester plugin depends on:

- DataStore@0.1.0 (for handler persistence if needed)
- Material-UI components for the user interface
- Apollo Client for GraphQL operations

## Contributing

When adding new features to the Tester plugin:

1. Follow the established plugin patterns
2. Update this README with new functionality
3. Add appropriate error handling
4. Test with multiple argument types
5. Ensure UI responsiveness

The Tester plugin makes it easy to validate plugin functionality and debug issues during development!
