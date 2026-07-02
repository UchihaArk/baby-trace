"use client";

import { useSyncExternalStore } from "react";

/**
 * 访问暗号的「已解锁」状态：按 babyId 记录其解锁时所对应的 accessCodeVersion。
 *
 * 判定已解锁 ⇔ 本地记录的 version === 服务端当前 version。
 * 设置/修改/关闭暗号时服务端会让 version 自增，于是旧的解锁记录自动失效，
 * 下次进入该宝宝会重新要求输入暗号（含其他设备/会话）。
 *
 * 仅在前端 localStorage 持久化（无鉴权 app 的轻量 UI 门禁）。
 */

const STORAGE_KEY = "baby-trace:unlocked";

type UnlockMap = Record<string, number>;

const listeners = new Set<() => void>();
let cache: UnlockMap | null = null;

function readCache(): UnlockMap {
  if (cache) return cache;
  if (typeof window === "undefined") {
    cache = {};
    return cache;
  }
  try {
    cache = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as UnlockMap;
  } catch {
    cache = {};
  }
  return cache;
}

function writeCache(next: UnlockMap) {
  cache = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* 忽略隐私模式等写入失败 */
    }
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

if (typeof window !== "undefined") {
  // 跨标签同步：其他标签改了暗号（version 变）会通过 SWR 拉到新值，
  // 而其他标签清/改本地解锁时通过 storage 事件刷新本标签缓存。
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      cache = null;
      listeners.forEach((l) => l());
    }
  });
}

/** 记录某宝宝在指定 version 下已解锁 */
export function markUnlocked(babyId: number, version: number) {
  const map = readCache();
  if (map[String(babyId)] !== version) {
    writeCache({ ...map, [String(babyId)]: version });
  }
}

/** 非钩子版本：当前是否已解锁（用于无法用钩子的场景） */
export function isUnlocked(babyId: number, version: number): boolean {
  return readCache()[String(babyId)] === version;
}

/** 钩子：订阅某宝宝在指定 version 下的解锁状态 */
export function useAccessUnlocked(babyId: number, version: number): boolean {
  return useSyncExternalStore(
    subscribe,
    () => readCache()[String(babyId)] === version,
    () => false // SSR / 首屏一律视为未解锁，避免 hydration 不一致
  );
}
