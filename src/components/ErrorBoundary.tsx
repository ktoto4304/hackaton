import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // В реальном проекте — отправка в Sentry.
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex h-full w-full items-center justify-center p-6">
        <div className="max-w-md w-full rounded-lg border border-border bg-card p-6 shadow-lg">
          <h2 className="text-lg font-semibold mb-2">Что-то пошло не так</h2>
          <p className="text-sm text-muted-foreground mb-4 break-all">
            {this.state.error.message}
          </p>
          <div className="flex gap-2">
            <Button onClick={this.handleReset}>Попробовать снова</Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Перезагрузить
            </Button>
          </div>
        </div>
      </div>
    );
  }
}