// ErrorBoundary.js
import React from 'react';
import { Typography } from '@contentful/forma-36-react-components';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state on error
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Typography style={{ color: 'red', padding: '20px' }}>
          Something went wrong: {this.state.error.message}
        </Typography>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
