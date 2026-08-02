"use client";

import { createContext, memo, useCallback, useContext, useMemo, useState } from "react";
import { useBaby } from "@/components/baby/baby-provider";
import { FeedDrawer } from "./feed-drawer";
import { DiaperDrawer } from "./diaper-drawer";
import { PumpDrawer } from "./pump-drawer";
import { CareDrawer, type CareType } from "./care-drawer";
import { MeasurementDrawer } from "./measurement-drawer";
import { SleepDrawer } from "./sleep-drawer";
import { FoodDrawer } from "./food-drawer";
import type { BabyMeasurement, LogApi, MeasurementKind } from "@/lib/types";

type DrawerKind = "feed" | "diaper" | "pump" | "care" | "weight" | "height" | "sleep" | "food" | null;

type LogEntryContextValue = {
  openFeed: (log?: LogApi) => void;
  openDiaper: (log?: LogApi) => void;
  openPump: (log?: LogApi) => void;
  openBath: (log?: LogApi) => void;
  openHaircut: (log?: LogApi) => void;
  openNail: (log?: LogApi) => void;
  openSleep: (log?: LogApi) => void;
  openFood: (log?: LogApi) => void;
  openWeight: (m?: BabyMeasurement) => void;
  openHeight: (m?: BabyMeasurement) => void;
};

const LogEntryContext = createContext<LogEntryContextValue | null>(null);

export function useLogEntry() {
  const v = useContext(LogEntryContext);
  if (!v) throw new Error("useLogEntry must be used within LogEntryProvider");
  return v;
}

/**
 * 抽屉组：memo 化。切换底部 Tab（父级重渲染）时，若所有抽屉都关闭
 * （kind/editing/babyId/onClose 均不变），整组抽屉跳过重渲染，显著减少 Tab 切换开销。
 */
const Drawers = memo(function Drawers({
  kind,
  careType,
  measureKind,
  editing,
  measureEditing,
  babyId,
  onClose,
}: {
  kind: DrawerKind;
  careType: CareType;
  measureKind: MeasurementKind;
  editing: LogApi | null;
  measureEditing: BabyMeasurement | null;
  babyId: number | null;
  onClose: () => void;
}) {
  const handleChange = (o: boolean) => {
    if (!o) onClose();
  };
  return (
    <>
      <FeedDrawer babyId={babyId} open={kind === "feed"} editing={editing} onOpenChange={handleChange} />
      <DiaperDrawer babyId={babyId} open={kind === "diaper"} editing={editing} onOpenChange={handleChange} />
      <PumpDrawer babyId={babyId} open={kind === "pump"} editing={editing} onOpenChange={handleChange} />
      <CareDrawer
        babyId={babyId}
        open={kind === "care"}
        careType={careType}
        editing={editing}
        onOpenChange={handleChange}
      />
      <SleepDrawer babyId={babyId} open={kind === "sleep"} editing={editing} onOpenChange={handleChange} />
      <FoodDrawer babyId={babyId} open={kind === "food"} editing={editing} onOpenChange={handleChange} />
      <MeasurementDrawer
        babyId={babyId}
        open={kind === "weight" || kind === "height"}
        kind={measureKind}
        editing={measureEditing}
        onOpenChange={handleChange}
      />
    </>
  );
});

export function LogEntryProvider({ children }: { children: React.ReactNode }) {
  const { baby } = useBaby();
  const babyId = baby?.id ?? null;
  const [kind, setKind] = useState<DrawerKind>(null);
  const [careType, setCareType] = useState<CareType>("bath");
  const [measureKind, setMeasureKind] = useState<MeasurementKind>("weight");
  const [editing, setEditing] = useState<LogApi | null>(null);
  const [measureEditing, setMeasureEditing] = useState<BabyMeasurement | null>(null);

  const handleClose = useCallback(() => setKind(null), []);

  function open(k: Exclude<DrawerKind, null>, log?: LogApi, ct?: CareType) {
    setEditing(log ?? null);
    if (ct) setCareType(ct);
    setKind(k);
  }

  function openMeasurement(mk: MeasurementKind, m?: BabyMeasurement) {
    setMeasureEditing(m ?? null);
    setMeasureKind(mk);
    setKind(mk);
  }

  const value = useMemo<LogEntryContextValue>(
    () => ({
      openFeed: (log) => open("feed", log),
      openDiaper: (log) => open("diaper", log),
      openPump: (log) => open("pump", log),
      openBath: (log) => open("care", log, "bath"),
      openHaircut: (log) => open("care", log, "haircut"),
      openNail: (log) => open("care", log, "nail"),
      openSleep: (log) => open("sleep", log),
      openFood: (log) => open("food", log),
      openWeight: (m) => openMeasurement("weight", m),
      openHeight: (m) => openMeasurement("height", m),
    }),
    []
  );

  return (
    <LogEntryContext.Provider value={value}>
      {children}
      <Drawers
        kind={kind}
        careType={careType}
        measureKind={measureKind}
        editing={editing}
        measureEditing={measureEditing}
        babyId={babyId}
        onClose={handleClose}
      />
    </LogEntryContext.Provider>
  );
}
