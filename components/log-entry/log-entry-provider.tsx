"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { useBaby } from "@/components/baby/baby-provider";
import { FeedDrawer } from "./feed-drawer";
import { DiaperDrawer } from "./diaper-drawer";
import { PumpDrawer } from "./pump-drawer";
import type { LogApi } from "@/lib/types";

type DrawerKind = "feed" | "diaper" | "pump" | null;

type LogEntryContextValue = {
  openFeed: (log?: LogApi) => void;
  openDiaper: (log?: LogApi) => void;
  openPump: (log?: LogApi) => void;
};

const LogEntryContext = createContext<LogEntryContextValue | null>(null);

export function useLogEntry() {
  const v = useContext(LogEntryContext);
  if (!v) throw new Error("useLogEntry must be used within LogEntryProvider");
  return v;
}

export function LogEntryProvider({ children }: { children: React.ReactNode }) {
  const { baby } = useBaby();
  const babyId = baby?.id ?? null;
  const [kind, setKind] = useState<DrawerKind>(null);
  const [editing, setEditing] = useState<LogApi | null>(null);

  function open(k: Exclude<DrawerKind, null>, log?: LogApi) {
    setEditing(log ?? null);
    setKind(k);
  }
  function close() {
    setKind(null);
  }

  const value = useMemo<LogEntryContextValue>(
    () => ({
      openFeed: (log) => open("feed", log),
      openDiaper: (log) => open("diaper", log),
      openPump: (log) => open("pump", log),
    }),
    []
  );

  return (
    <LogEntryContext.Provider value={value}>
      {children}
      <FeedDrawer babyId={babyId} open={kind === "feed"} editing={editing} onOpenChange={(o) => !o && close()} />
      <DiaperDrawer babyId={babyId} open={kind === "diaper"} editing={editing} onOpenChange={(o) => !o && close()} />
      <PumpDrawer babyId={babyId} open={kind === "pump"} editing={editing} onOpenChange={(o) => !o && close()} />
    </LogEntryContext.Provider>
  );
}
