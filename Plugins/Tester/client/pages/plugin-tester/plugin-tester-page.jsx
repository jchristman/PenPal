import React, { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { Components, registerComponent } from "@penpal/core";
import { makeStyles } from "@mui/styles";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Button,
  Chip,
  Grid,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Divider,
  CircularProgress,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayArrowIcon,
  BugReport as BugReportIcon,
  Code as CodeIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  AccessTime as AccessTimeIcon,
} from "@mui/icons-material";

import GET_TEST_HANDLERS from "./queries/get-test-handlers.js";
import INVOKE_TEST_HANDLER from "./mutations/invoke-test-handler.js";

const useStyles = makeStyles((theme) => ({
  testerPage: {
    padding: 20,
    maxWidth: 1200,
    margin: "0 auto",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: "2px solid #e1e5e9",
  },
  headerIcon: {
    fontSize: 32,
    color: "#3498db",
  },
  title: {
    fontSize: 28,
    fontWeight: 600,
    color: "#2c3e50",
  },
  noHandlers: {
    textAlign: "center",
    padding: 40,
    color: "#6c757d",
  },
  handlerCard: {
    marginBottom: 16,
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    "&:hover": {
      boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
    },
  },
  handlerHeader: {
    background: "#f8f9fa",
  },
  handlerContent: {
    padding: "16px !important",
  },
  pluginChip: {
    marginRight: 8,
    background: "#3498db",
    color: "white",
    fontWeight: 500,
  },
  argumentForm: {
    marginTop: 16,
    padding: 16,
    background: "#f8f9fa",
    borderRadius: 8,
  },
  argumentField: {
    marginBottom: 12,
  },
  executeButton: {
    marginTop: 16,
    background: "#28a745",
    color: "white",
    "&:hover": {
      background: "#218838",
    },
  },
  resultSection: {
    marginTop: 16,
  },
  resultSuccess: {
    background: "#d4edda",
    border: "1px solid #c3e6cb",
    borderRadius: 8,
    padding: 16,
  },
  resultError: {
    background: "#f8d7da",
    border: "1px solid #f5c6cb",
    borderRadius: 8,
    padding: 16,
  },
  executionTime: {
    fontSize: 12,
    color: "#6c757d",
    marginTop: 8,
  },
  codeBlock: {
    background: "#f4f4f4",
    border: "1px solid #ddd",
    borderRadius: 4,
    padding: 12,
    fontFamily: "Monaco, Consolas, monospace",
    fontSize: 12,
    overflowX: "auto",
    marginTop: 8,
  },
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 400,
  },
}));

// Component for rendering individual argument inputs
const ArgumentInput = ({ arg, value, onChange, error }) => {
  const getInputComponent = () => {
    switch (arg.type?.toLowerCase()) {
      case "string":
      case "text":
        return (
          <TextField
            fullWidth
            label={arg.name}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            helperText={arg.description}
            required={arg.required}
            error={!!error}
          />
        );
      case "number":
      case "integer":
        return (
          <TextField
            fullWidth
            type="number"
            label={arg.name}
            value={value || ""}
            onChange={(e) => onChange(parseFloat(e.target.value) || "")}
            helperText={arg.description}
            required={arg.required}
            error={!!error}
          />
        );
      case "boolean":
        return (
          <FormControl fullWidth error={!!error}>
            <InputLabel>{arg.name}</InputLabel>
            <Select
              value={value ?? ""}
              onChange={(e) => onChange(e.target.value === "true")}
              label={arg.name}
            >
              <MenuItem value="">-- Select --</MenuItem>
              <MenuItem value="true">True</MenuItem>
              <MenuItem value="false">False</MenuItem>
            </Select>
            {arg.description && (
              <FormHelperText>{arg.description}</FormHelperText>
            )}
          </FormControl>
        );
      case "array":
      case "object":
      case "json":
        return (
          <TextField
            fullWidth
            multiline
            rows={3}
            label={`${arg.name} (JSON)`}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            helperText={arg.description || "Enter valid JSON"}
            required={arg.required}
            error={!!error}
          />
        );
      default:
        return (
          <TextField
            fullWidth
            label={arg.name}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            helperText={arg.description}
            required={arg.required}
            error={!!error}
          />
        );
    }
  };

  return (
    <Box className="argumentField">
      {getInputComponent()}
      {error && (
        <Typography
          variant="caption"
          color="error"
          display="block"
          sx={{ mt: 1 }}
        >
          {error}
        </Typography>
      )}
    </Box>
  );
};

// Component for rendering test results
const TestResult = ({ result, classes }) => {
  if (!result) return null;

  const {
    success,
    result: data,
    error,
    stack,
    execution_time,
    invoked_at,
  } = result;

  return (
    <Box className={classes.resultSection}>
      <Alert
        severity={success ? "success" : "error"}
        icon={success ? <CheckCircleIcon /> : <ErrorIcon />}
        sx={{ mb: 2 }}
      >
        Test {success ? "Passed" : "Failed"}
        {execution_time && (
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            <AccessTimeIcon sx={{ fontSize: 14, mr: 1 }} />
            Executed in {execution_time}ms
          </Typography>
        )}
      </Alert>

      {success && data !== undefined && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            <CodeIcon sx={{ fontSize: 16, mr: 1 }} />
            Result:
          </Typography>
          <Box className={classes.codeBlock}>
            {typeof data === "object"
              ? JSON.stringify(data, null, 2)
              : String(data)}
          </Box>
        </Paper>
      )}

      {!success && error && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom color="error">
            Error:
          </Typography>
          <Typography variant="body2" color="error">
            {error}
          </Typography>
          {stack && (
            <>
              <Typography
                variant="subtitle2"
                gutterBottom
                color="error"
                sx={{ mt: 2 }}
              >
                Stack Trace:
              </Typography>
              <Box className={classes.codeBlock}>{stack}</Box>
            </>
          )}
        </Paper>
      )}

      <Typography variant="caption" color="textSecondary">
        Invoked at: {new Date(invoked_at).toLocaleString()}
      </Typography>
    </Box>
  );
};

// Component for individual test handler
const TestHandlerCard = ({ handler, classes }) => {
  const [argumentValues, setArgumentValues] = useState({});
  const [argumentErrors, setArgumentErrors] = useState({});
  const [testResult, setTestResult] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const [invokeHandler, { loading: invoking }] =
    useMutation(INVOKE_TEST_HANDLER);

  const updateArgumentValue = (argName, value) => {
    setArgumentValues((prev) => ({
      ...prev,
      [argName]: value,
    }));

    // Clear error when user starts typing
    if (argumentErrors[argName]) {
      setArgumentErrors((prev) => ({
        ...prev,
        [argName]: null,
      }));
    }
  };

  const validateArguments = () => {
    const errors = {};
    let isValid = true;

    handler.args_schema.forEach((arg) => {
      const value = argumentValues[arg.name];

      if (
        arg.required &&
        (value === undefined || value === null || value === "")
      ) {
        errors[arg.name] = "This field is required";
        isValid = false;
      }

      // Validate JSON for complex types
      if (
        ["array", "object", "json"].includes(arg.type?.toLowerCase()) &&
        value
      ) {
        try {
          JSON.parse(value);
        } catch (e) {
          errors[arg.name] = "Invalid JSON format";
          isValid = false;
        }
      }
    });

    setArgumentErrors(errors);
    return isValid;
  };

  const handleExecute = async () => {
    if (!validateArguments()) {
      return;
    }

    // Prepare arguments array
    const args = handler.args_schema.map((arg) => {
      let value = argumentValues[arg.name];

      // Parse JSON for complex types
      if (
        ["array", "object", "json"].includes(arg.type?.toLowerCase()) &&
        value
      ) {
        try {
          value = JSON.parse(value);
        } catch (e) {
          // Already validated, but just in case
          value = null;
        }
      }

      return value;
    });

    try {
      const { data } = await invokeHandler({
        variables: {
          handler_id: handler.id,
          args: args,
        },
      });

      setTestResult(data.invokeTestHandler);
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message,
        invoked_at: new Date().toISOString(),
      });
    }
  };

  return (
    <Card className={classes.handlerCard}>
      <CardHeader
        className={classes.handlerHeader}
        title={
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h6">{handler.handler_name}</Typography>
            <Chip
              label={handler.plugin_name}
              className={classes.pluginChip}
              size="small"
            />
          </Box>
        }
        action={
          <Button
            variant="contained"
            startIcon={<PlayArrowIcon />}
            onClick={handleExecute}
            disabled={invoking}
            className={classes.executeButton}
          >
            {invoking ? <CircularProgress size={20} /> : "Execute"}
          </Button>
        }
      />
      <CardContent className={classes.handlerContent}>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Registered: {new Date(handler.registered_at).toLocaleString()}
        </Typography>

        {handler.args_schema.length > 0 && (
          <Accordion
            expanded={isExpanded}
            onChange={() => setIsExpanded(!isExpanded)}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">
                Arguments ({handler.args_schema.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box className={classes.argumentForm}>
                {handler.args_schema.map((arg, index) => (
                  <ArgumentInput
                    key={index}
                    arg={arg}
                    value={argumentValues[arg.name]}
                    onChange={(value) => updateArgumentValue(arg.name, value)}
                    error={argumentErrors[arg.name]}
                  />
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        <TestResult result={testResult} classes={classes} />
      </CardContent>
    </Card>
  );
};

const PluginTesterPage = () => {
  const classes = useStyles();
  const { data, loading, error, refetch } = useQuery(GET_TEST_HANDLERS, {
    pollInterval: 5000, // Refresh every 5 seconds
  });

  // State for tracking which plugin sections are expanded (collapsed by default)
  const [expandedPlugins, setExpandedPlugins] = useState({});

  const togglePluginExpansion = (pluginName) => {
    setExpandedPlugins((prev) => ({
      ...prev,
      [pluginName]: !prev[pluginName],
    }));
  };

  if (loading) {
    return (
      <Box className={classes.loading}>
        <CircularProgress size={40} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading test handlers...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className={classes.testerPage}>
        <Alert severity="error">
          Error loading test handlers: {error.message}
        </Alert>
      </Box>
    );
  }

  const handlers = data?.getTestHandlers || [];

  // Group handlers by plugin
  const groupedHandlers = handlers.reduce((acc, handler) => {
    const plugin = handler.plugin_name;
    if (!acc[plugin]) {
      acc[plugin] = [];
    }
    acc[plugin].push(handler);
    return acc;
  }, {});

  return (
    <Box className={classes.testerPage}>
      <Box className={classes.header}>
        <BugReportIcon className={classes.headerIcon} />
        <Typography variant="h4" className={classes.title}>
          Plugin Tester
        </Typography>
        <Box sx={{ ml: "auto" }}>
          <Button variant="outlined" onClick={() => refetch()}>
            Refresh
          </Button>
        </Box>
      </Box>

      {handlers.length === 0 ? (
        <Paper className={classes.noHandlers}>
          <BugReportIcon sx={{ fontSize: 48, color: "#ccc", mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No test handlers registered
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Use <code>PenPal.Tester.RegisterHandler()</code> in your plugins to
            register test handlers.
          </Typography>
        </Paper>
      ) : (
        Object.entries(groupedHandlers).map(([pluginName, pluginHandlers]) => (
          <Accordion
            key={pluginName}
            expanded={expandedPlugins[pluginName] || false}
            onChange={() => togglePluginExpansion(pluginName)}
            sx={{ mb: 2, boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                background: "#f8f9fa",
                "& .MuiAccordionSummary-content": {
                  alignItems: "center",
                  gap: 1,
                },
              }}
            >
              <CodeIcon sx={{ color: "#3498db" }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {pluginName}
              </Typography>
              <Chip
                label={`${pluginHandlers.length} handlers`}
                size="small"
                sx={{ ml: 1, background: "#3498db", color: "white" }}
              />
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <Box sx={{ p: 2 }}>
                {pluginHandlers.map((handler) => (
                  <TestHandlerCard
                    key={handler.id}
                    handler={handler}
                    classes={classes}
                  />
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        ))
      )}
    </Box>
  );
};

registerComponent("PluginTesterPage", PluginTesterPage);

export default PluginTesterPage;
