"use client";

import * as React from "react";

type Props = {
  children: React.ReactNode;
  fallback: React.ReactNode;
  name?: string;
};

type State = { error: Error | null };

/** Catches synchronous render errors below this node (crash isolation). */
export class ClientErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error) {
    console.error(`[ClientErrorBoundary${this.props.name ? `:${this.props.name}` : ""}]`, error);
  }

  override render() {
    if (this.state.error) return this.props.fallback;
    return this.props.children;
  }
}
