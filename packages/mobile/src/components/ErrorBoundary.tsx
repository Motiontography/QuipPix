import React, { Component, ErrorInfo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { captureError } from '../services/errorReporting';
import { t } from '../i18n';
import { spacing, borderRadius, typography } from '../styles/theme';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    captureError(error, {
      componentStack: errorInfo.componentStack ?? 'unknown',
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return <ErrorFallback onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}

function ErrorFallback({ onRetry, errorDetail }: { onRetry: () => void; errorDetail?: string }) {
  return (
    <View style={fallbackStyles.container}>
      <Text style={fallbackStyles.icon}>!</Text>
      <Text style={fallbackStyles.title}>{t('error.title')}</Text>
      <Text style={fallbackStyles.message}>
        {t('error.message')}
      </Text>
      {errorDetail ? (
        <Text style={[fallbackStyles.message, { fontSize: 11, marginTop: 8 }]}>
          {errorDetail}
        </Text>
      ) : null}
      <TouchableOpacity style={fallbackStyles.button} onPress={onRetry}>
        <Text style={fallbackStyles.buttonText}>{t('error.retry')}</Text>
      </TouchableOpacity>
    </View>
  );
}

// Static styles — not theme-aware because the boundary may catch
// errors before ThemeProvider mounts.
const fallbackStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0F1A',
    padding: spacing.xl,
  },
  icon: {
    fontSize: 48,
    color: '#E17055',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: '#FFFFFF',
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    color: '#B0B0CC',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  button: {
    backgroundColor: '#6C5CE7',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  buttonText: {
    ...typography.bodyBold,
    color: '#FFFFFF',
  },
});
