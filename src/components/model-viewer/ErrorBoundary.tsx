
import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
  onError: (error: any) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      error: error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error and call the error handler
    console.error("Error caught by ErrorBoundary:", error);
    console.error("Component stack:", errorInfo.componentStack);
    
    this.props.onError({
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Reset error state if children change
    if (prevProps.children !== this.props.children && this.state.hasError) {
      console.log("ErrorBoundary: Children changed, resetting error state");
      this.setState({ 
        hasError: false,
        error: null
      });
    }
  }

  render() {
    if (this.state.hasError) {
      console.log("ErrorBoundary: Rendering fallback UI");
      return this.props.fallback;
    }
    
    return this.props.children;
  }
}

export default ErrorBoundary;
