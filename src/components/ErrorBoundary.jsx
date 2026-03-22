import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: 'red', backgroundColor: '#fff', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h2>Something went horribly wrong!</h2>
          <p style={{ fontWeight: 'bold' }}>{this.state.error?.toString()}</p>
          <pre style={{ background: '#f8f8f8', padding: '1rem', overflowX: 'auto', color: '#B22222', fontSize: '12px' }}>
            {this.state.error?.stack}
          </pre>
          <h3>Component Stack:</h3>
          <pre style={{ background: '#f8f8f8', padding: '1rem', overflowX: 'auto', color: '#006400', fontSize: '12px' }}>
            {this.state.errorInfo?.componentStack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
