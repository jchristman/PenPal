import React from "react";
import { Components, registerComponent } from "@penpal/core";
import { serializeError } from "serialize-error";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      err_number: -1,
      err_message: "",
      err_stack: "",
      hasError: false,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    //const serialized_error = serializeError(error);
    //Meteor.call(
    //  "logErrorToServerConsole",
    //  serialized_error,
    //  errorInfo,
    //  (err, res) => {
    //    this.setState({
    //      err_number: res,
    //      err_message: serialized_error.message,
    //      err_stack: serialized_error.stack,
    //    });
    //  }
    //);
    console.error(error);
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
