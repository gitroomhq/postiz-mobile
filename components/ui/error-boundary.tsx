import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // TODO: Send to error reporting service (e.g. Sentry)
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center bg-main-sections px-6">
          <Text className="mb-2 font-jakarta text-h2 font-semibold text-text-primary">
            Something went wrong
          </Text>
          <Text className="mb-6 text-center font-jakarta text-body-1 text-text-secondary">
            An unexpected error occurred. Please try again.
          </Text>
          <Pressable
            className="h-11 w-full items-center justify-center rounded-[8px] bg-buttons-primary-bg"
            onPress={this.handleReset}
          >
            <Text className="font-jakarta text-button font-semibold text-buttons-primary-text">
              Try Again
            </Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
