"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MAX_PULL = 88; // 最大下拉距离（带阻尼）
const THRESHOLD = 56; // 触发刷新的距离

/**
 * 简易下拉刷新（移动端触摸）。
 * 仅在页面已滚到顶部(scrollY<=0)且向下拖动时激活；松手超过阈值触发 onRefresh。
 * onRefresh 返回的 Promise resolve 后收起指示器。
 */
export function usePullToRefresh(onRefresh: () => Promise<void> | void) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [pulling, setPulling] = useState(false);

  const startY = useRef(0);
  const active = useRef(false);
  const pullVal = useRef(0);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const onTouchStart = useCallback(
    (e: TouchEvent) => {
      if (refreshing || window.scrollY > 0) return;
      active.current = true;
      startY.current = e.touches[0].clientY;
    },
    [refreshing]
  );

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!active.current) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0) {
        if (pullVal.current !== 0) {
          pullVal.current = 0;
          setPull(0);
          setPulling(false);
        }
        return;
      }
      if (window.scrollY > 0) return;
      const resisted = Math.min(delta * 0.5, MAX_PULL);
      if (!pulling) setPulling(true);
      pullVal.current = resisted;
      setPull(resisted);
      if (e.cancelable && resisted > 2) e.preventDefault();
    },
    [pulling]
  );

  const onTouchEnd = useCallback(() => {
    if (!active.current) return;
    active.current = false;
    setPulling(false);
    if (pullVal.current >= THRESHOLD) {
      pullVal.current = THRESHOLD;
      setPull(THRESHOLD);
      setRefreshing(true);
    } else {
      pullVal.current = 0;
      setPull(0);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [onTouchStart, onTouchMove, onTouchEnd]);

  useEffect(() => {
    if (!refreshing) return;
    let ok = true;
    (async () => {
      try {
        await onRefreshRef.current();
      } finally {
        if (ok) {
          setRefreshing(false);
          setPull(0);
          pullVal.current = 0;
        }
      }
    })();
    return () => {
      ok = false;
    };
  }, [refreshing]);

  return { pull, refreshing, pulling };
}
