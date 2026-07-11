"use client";

import { useEffect, useMemo, useReducer } from "react";
import useSWR from "swr";
import { api } from "./api-client";
import { nowSec, startOfLocalDaySec } from "./time";
import type {
  Baby,
  BabyMeasurement,
  BabyVaccine,
  CareSummary,
  LogApi,
  MeasurementKind,
  Summary,
  TodayStats,
  TrendResponse,
} from "./types";

export const RECENT_LIMIT = 5;
export const DASHBOARD_REFRESH_MS = 5000;

export const BABIES_KEY = "babies:list";
export const BABY_KEY = (name: string) => `baby:${name}`;
export const STATS_KEY = (babyId: number, since: number) => `stats:${babyId}:today:${since}`;
export const RECENT_KEY = (babyId: number, limit = RECENT_LIMIT) => `logs:${babyId}:recent:${limit}`;

/** 所有宝宝（列表页用） */
export function useBabies() {
  return useSWR<Baby[]>(BABIES_KEY, async () => {
    const res = await api.babies.$get();
    if (!res.ok) throw new Error("加载宝宝列表失败");
    return res.json();
  });
}

/** 当前宝宝（按 name 从 URL 解析） */
export function useBabyByName(name: string) {
  return useSWR<Baby>(BABY_KEY(name), async () => {
    const res = await api.babies[":name"].$get({ param: { name } });
    if (!res.ok) throw new Error("未找到宝宝");
    return res.json();
  });
}

export function useTodayStats(babyId: number | null) {
  const since = useMemo(() => startOfLocalDaySec(), []);
  return useSWR<TodayStats>(
    babyId != null ? STATS_KEY(babyId, since) : null,
    async () => {
      const res = await api.stats.today.$get({ query: { babyId: String(babyId), since: String(since) } });
      if (!res.ok) throw new Error("加载统计失败");
      return res.json();
    },
    { refreshInterval: DASHBOARD_REFRESH_MS }
  );
}

export function useRecentLogs(babyId: number | null, limit = RECENT_LIMIT) {
  return useSWR<LogApi[]>(
    babyId != null ? RECENT_KEY(babyId, limit) : null,
    async () => {
      const res = await api.logs.$get({ query: { babyId: String(babyId), limit: String(limit) } });
      if (!res.ok) throw new Error("加载记录失败");
      return res.json();
    },
    { refreshInterval: DASHBOARD_REFRESH_MS }
  );
}

/**
 * 单日记录：返回某自然日 [dayStart, dayStart+1天) 的全部记录（按时间倒序）。
 * 历史页用——默认今天，可切换到任意历史日期。
 */
export const LOGS_BY_DAY_KEY = (babyId: number, dayStart: number) =>
  `logs:${babyId}:day:${dayStart}`;

export function useLogsByDay(babyId: number | null, dayStart: number) {
  return useSWR<LogApi[]>(
    babyId != null ? LOGS_BY_DAY_KEY(babyId, dayStart) : null,
    async () => {
      const res = await api.logs.$get({
        query: { babyId: String(babyId), day: String(dayStart) },
      });
      if (!res.ok) throw new Error("加载记录失败");
      return res.json();
    }
  );
}

/** 进行中睡眠的实时计时（秒） */
/** 统计汇总（按时间区间） */
export const SUMMARY_KEY = (babyId: number, from: number, to: number) =>
  `summary:${babyId}:${from}:${to}`;

export function useStatsSummary(babyId: number | null, from: number, to: number) {
  return useSWR<Summary>(babyId != null ? SUMMARY_KEY(babyId, from, to) : null, async () => {
    const res = await api.stats.summary.$get({
      query: { babyId: String(babyId), from: String(from), to: String(to) },
    });
    if (!res.ok) throw new Error("加载统计失败");
    return res.json();
  });
}

/** 趋势：trailing N 周期聚合（starts 为升序 unix 秒逗号串，to 为末周期结束） */
export const TREND_KEY = (babyId: number, starts: string, to: number) => `trend:${babyId}:${starts}:${to}`;

export function useStatsTrend(babyId: number | null, starts: string, to: number) {
  return useSWR<TrendResponse>(babyId != null ? TREND_KEY(babyId, starts, to) : null, async () => {
    const res = await api.stats.trend.$get({
      query: { babyId: String(babyId), starts, to: String(to) },
    });
    if (!res.ok) throw new Error("加载趋势失败");
    return res.json();
  });
}

/** 护理：全历史平均间隔 */
export const CARE_KEY = (babyId: number) => `care:${babyId}`;

export function useStatsCare(babyId: number | null) {
  return useSWR<CareSummary>(babyId != null ? CARE_KEY(babyId) : null, async () => {
    const res = await api.stats.care.$get({ query: { babyId: String(babyId) } });
    if (!res.ok) throw new Error("加载护理失败");
    return res.json();
  });
}

/** 身体测量（体重 / 身高）：某宝宝某种类的全部测量，按时间升序 */
export const MEASUREMENTS_KEY = (babyId: number, kind: MeasurementKind) =>
  `measurements:${babyId}:${kind}`;

export function useMeasurements(babyId: number | null, kind: MeasurementKind) {
  return useSWR<BabyMeasurement[]>(
    babyId != null ? MEASUREMENTS_KEY(babyId, kind) : null,
    async () => {
      const res = await api.measurements.$get({ query: { babyId: String(babyId), kind } });
      if (!res.ok) throw new Error("加载测量失败");
      return res.json();
    }
  );
}

/** 疫苗接种：某宝宝的全部接种记录，按接种时间升序 */
export const VACCINES_KEY = (babyId: number) => `vaccines:${babyId}`;

export function useVaccines(babyId: number | null) {
  return useSWR<BabyVaccine[]>(babyId != null ? VACCINES_KEY(babyId) : null, async () => {
    const res = await api.vaccines.$get({ query: { babyId: String(babyId) } });
    if (!res.ok) throw new Error("加载疫苗失败");
    return res.json();
  });
}

export function useElapsed(startTsSec: number | null): number | null {
  const [, tick] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    if (startTsSec == null) return;
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTsSec, tick]);

  if (startTsSec == null) return null;
  return Math.max(0, nowSec() - startTsSec);
}
