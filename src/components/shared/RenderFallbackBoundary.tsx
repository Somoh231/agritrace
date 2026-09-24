"use client";

import * as React from "react";

/**
 * Contains a failing subtree (e.g. a lazily loaded map chunk that cannot be
 * fetched offline) so the surrounding form keeps working.
 */
export default class RenderFallbackBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("[ui] contained render failure", error instanceof Error ? error.message : error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
