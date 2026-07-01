"use client";

import { createContext, useContext, useMemo } from "react";
import type { KeyedMutator } from "swr";
import { useBabyByName } from "@/lib/hooks";
import type { Baby } from "@/lib/types";

type BabyContextValue = {
  baby: Baby | null;
  isLoading: boolean;
  error: unknown;
  /** 当前宝宝的 bound mutate：直接更新该 hook 订阅的那个缓存键，确保 UI 立即变更 */
  mutateBaby: KeyedMutator<Baby>;
};

const BabyContext = createContext<BabyContextValue | null>(null);

export function useBaby() {
  const v = useContext(BabyContext);
  if (!v) throw new Error("useBaby must be used within BabyProvider");
  return v;
}

export function BabyProvider({ name, children }: { name: string; children: React.ReactNode }) {
  const { data, error, isLoading, mutate } = useBabyByName(name);
  // memo：value 引用稳定，baby 未变时不触发所有 useBaby 消费者重渲染
  const value = useMemo<BabyContextValue>(
    () => ({ baby: data ?? null, isLoading, error, mutateBaby: mutate }),
    [data, isLoading, error, mutate]
  );
  return <BabyContext.Provider value={value}>{children}</BabyContext.Provider>;
}
