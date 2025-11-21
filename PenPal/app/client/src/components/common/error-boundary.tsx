import React from "react";
import { Components, registerComponent } from "@penpal/core";
import { serializeError } from "serialize-error";

interface ErrorBoundaryState {
  err_number: number;
  err_message: string;
  err_stack: string;
  hasError: boolean;
}

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      err_number: -1,
      err_message: "",
      err_stack: "",
      hasError: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Try to extract message and stack from error
    let err_message = "";
    let err_stack = "";
    let err_number = -1;

    if (error) {
      if (typeof error === "string") {
        err_message = error;
      } else if (error.message) {
        err_message = error.message;
      } else {
        try {
          err_message = JSON.stringify(error);
        } catch (e) {
          err_message = String(error);
        }
      }
      if (error.stack) {
        err_stack = error.stack;
      }
    }

    // errorInfo is React's component stack
    if (errorInfo && errorInfo.componentStack) {
      err_stack += (err_stack ? "\n\n" : "") + errorInfo.componentStack;
    }

    // Optionally use serializeError for more detail
    // const serialized = serializeError(error);
    // if (serialized && serialized.stack) err_stack = serialized.stack;
    // if (serialized && serialized.message) err_message = serialized.message;

    this.setState({
      hasError: true,
      err_number,
      err_message,
      err_stack,
    });
    // Optionally log to server here
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <Components.ErrorDisplay
          err_number={this.state.err_number}
          message={this.state.err_message}
          stack={this.state.err_stack}
        />
      );
    }

    return this.props.children;
  }
}

registerComponent("ErrorBoundary", ErrorBoundary);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ErrorBoundary;
