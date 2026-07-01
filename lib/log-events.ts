/**
 * 日志变更事件总线。
 * 背景：useSWRInfinite 不会因全局 mutate(matcher) 重新拉取其分页缓存，
 * 只有它自己的 bound mutate 才会刷新。因此日志增删改后通过 notifyLogsMutated()
 * 通知「历史页」用 bound mutate 重新加载列表。
 */
type Listener = () => void;

const listeners = new Set<Listener>();

export function subscribeLogsMutated(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function notifyLogsMutated(): void {
  listeners.forEach((fn) => fn());
}
