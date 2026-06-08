import React from 'react';
import { ErrorDisplay } from './ErrorDisplay';

interface Props {
  children: React.ReactNode;
  onError?: (err: Error) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="p-4">
          <ErrorDisplay type="runtime" error={{ message: this.state.error.message }} />
        </div>
      );
    }
    return this.props.children;
  }
}
