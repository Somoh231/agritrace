"use client";

import * as React from "react";

/**
 * UI layer of the read-only preview capability. The server (middleware + RLS)
 * already refuses every write; this only keeps mutation controls from being
 * offered, so the preview never shows an action that would fail.
 */
const ReadOnlyPreviewContext = React.createContext(false);

export function ReadOnlyPreviewProvider({ readOnly, children }: { readOnly: boolean; children: React.ReactNode }) {
  return <ReadOnlyPreviewContext.Provider value={readOnly}>{children}</ReadOnlyPreviewContext.Provider>;
}

export function useReadOnlyPreview(): boolean {
  return React.useContext(ReadOnlyPreviewContext);
}

/** Renders its children only for accounts that may act. */
export function MutationControl({ children }: { children: React.ReactNode }) {
  return useReadOnlyPreview() ? null : <>{children}</>;
}
