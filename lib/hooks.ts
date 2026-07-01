"use client";

import { useEffect, useMemo, useReducer } from "react";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { api } from "./api-client";
import { nowSec, startOfLocalDaySec } from "./time";
import type { Baby, LogApi, Summary, TodayStats } from "./types";

export const RECENT_LIMIT = 5;
export const HISTORY_PAGE_SIZE = 30;
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
 * 历史记录无限滚动（游标分页）。
 * key 编码为 `logs:{babyId}:page:{beforeTs}:{beforeId}`，fetcher 解析后请求 /api/logs。
 */
export function useBabyLogsInfinite(babyId: number | null) {
  return useSWRInfinite<LogApi[]>(
    (_index, prev) => {
      if (babyId == null) return null;
      if (prev && prev.length === 0) return null; // 已到尽头
      const last = prev?.[prev.length - 1];
      const ts = last ? String(last.startTime) : "";
      const id = last ? String(last.id) : "";
      return `logs:${babyId}:page:${ts}:${id}`;
    },
    async (key: string) => {
      const parts = key.split(":"); // [logs, babyId, "page", ts, id]
      const query: { babyId: string; limit: string; beforeTs?: string; beforeId?: string } = {
        babyId: parts[1],
        limit: String(HISTORY_PAGE_SIZE),
      };
      if (parts[3] && parts[4]) {
        query.beforeTs = parts[3];
        query.beforeId = parts[4];
      }
      const res = await api.logs.$get({ query });
      if (!res.ok) throw new Error("加载历史失败");
      return res.json();
    },
    // 进入历史页时重新拉取第一页，确保看到最新记录（而非上次的缓存）
    { revalidateFirstPage: true }
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
