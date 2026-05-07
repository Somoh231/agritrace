"use client";

import * as React from "react";

import { demoOperationalActor } from "@/lib/ops/current-actor";
import type { OperationalActor } from "@/lib/ops/permissions";

const OperationalActorContext = React.createContext<OperationalActor>(demoOperationalActor());

export default function OperationalActorProvider({
  actor,
  children,
}: {
  actor: OperationalActor;
  children: React.ReactNode;
}) {
  return <OperationalActorContext.Provider value={actor}>{children}</OperationalActorContext.Provider>;
}

export function useOperationalActor(): OperationalActor {
  return React.useContext(OperationalActorContext);
}
