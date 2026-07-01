"use client";

import { mutate } from "swr";
import { toast } from "sonner";
import { api } from "./api-client";
import { notifyLogsMutated } from "./log-events";
import { BABIES_KEY, BABY_KEY, RECENT_KEY, RECENT_LIMIT } from "./hooks";
import { nowSec } from "./time";
import type {
  Baby,
  CreateBabyInput,
  CreateLogInput,
  LogApi,
  UpdateBabyInput,
  UpdateLogInput,
} from "./types";

const revalidateLogs = (babyId: number) => {
  // 通知历史页（useSWRInfinite）用 bound mutate 刷新；普通缓存由下面的 mutate 刷新
  notifyLogsMutated();
  return mutate((k) => typeof k === "string" && k.startsWith(`logs:${babyId}:`));
};
const revalidateStats = (babyId: number) =>
  mutate((k) => typeof k === "string" && k.startsWith(`stats:${babyId}:`));
const revalidateBabies = () => mutate((k) => typeof k === "string" && k === BABIES_KEY);

const tmpId = () => -Math.floor(Math.random() * 1e9);

async function errorMessage(res: { json: () => Promise<unknown> }): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  return body.error ?? "操作失败";
}

function buildTemp(babyId: number, input: CreateLogInput): LogApi {
  return {
    id: tmpId(),
    babyId,
    activityType: input.activityType,
    startTime: input.startTime,
    endTime: input.endTime ?? null,
    amount: input.amount ?? null,
    details: input.details ?? null,
    notes: input.notes ?? null,
    createdAt: nowSec(),
  };
}

/** 新建记录（乐观） */
export async function createLog(babyId: number, input: CreateLogInput): Promise<LogApi | null> {
  const temp = buildTemp(babyId, input);
  const key = RECENT_KEY(babyId, RECENT_LIMIT);
  await mutate(key, (list?: LogApi[]) => [temp, ...(list ?? [])], { revalidate: false });

  try {
    const res = await api.logs.$post({ json: input });
    if (!res.ok) throw new Error(await errorMessage(res));
    const created: LogApi = await res.json();
    toast.success("已记录 ✓");
    await Promise.all([revalidateLogs(babyId), revalidateStats(babyId)]);
    return created;
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "保存失败");
    await revalidateLogs(babyId);
    return null;
  }
}

/** 编辑记录（乐观） */
export async function updateLog(
  id: number,
  babyId: number,
  patch: UpdateLogInput
): Promise<boolean> {
  const key = RECENT_KEY(babyId, RECENT_LIMIT);
  await mutate(
    key,
    (list?: LogApi[]) =>
      list?.map((l) =>
        l.id === id
          ? { ...l, ...patch, details: patch.details !== undefined ? patch.details : l.details }
          : l
      ),
    { revalidate: false }
  );

  try {
    const res = await api.logs[":id"].$patch({ param: { id: String(id) }, json: patch });
    if (!res.ok) throw new Error(await errorMessage(res));
    toast.success("已更新 ✓");
    await Promise.all([revalidateLogs(babyId), revalidateStats(babyId)]);
    return true;
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "更新失败");
    await revalidateLogs(babyId);
    return false;
  }
}

/** 删除记录（乐观） */
export async function deleteLog(id: number, babyId: number): Promise<boolean> {
  const key = RECENT_KEY(babyId, RECENT_LIMIT);
  await mutate(key, (list?: LogApi[]) => list?.filter((l) => l.id !== id), { revalidate: false });

  try {
    const res = await api.logs[":id"].$delete({ param: { id: String(id) } });
    if (!res.ok) throw new Error(await errorMessage(res));
    toast.success("已删除");
    await Promise.all([revalidateLogs(babyId), revalidateStats(babyId)]);
    return true;
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "删除失败");
    await revalidateLogs(babyId);
    return false;
  }
}

/** 切换睡眠 */
export async function toggleSleep(babyId: number): Promise<"started" | "stopped" | null> {
  try {
    const res = await api.sleep.toggle.$post({ json: { babyId } });
    if (!res.ok) throw new Error(await errorMessage(res));
    const data = await res.json();
    toast.success(data.state === "started" ? "睡眠开始 💤" : "睡眠结束");
    await Promise.all([revalidateLogs(babyId), revalidateStats(babyId)]);
    return data.state;
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "操作失败");
    return null;
  }
}

/** 新建宝宝 */
export async function createBaby(input: CreateBabyInput): Promise<Baby | null> {
  try {
    const res = await api.babies.$post({ json: input });
    if (!res.ok) throw new Error(await errorMessage(res));
    const baby: Baby = await res.json();
    toast.success(`已添加 ${baby.name}宝宝`);
    await revalidateBabies();
    return baby;
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "添加失败");
    return null;
  }
}

/** 编辑宝宝。返回更新后的宝宝（若改名，调用方需跳转到新 URL） */
export async function updateBaby(
  id: number,
  oldName: string,
  patch: UpdateBabyInput
): Promise<Baby | null> {
  try {
    const res = await api.babies[":id"].$patch({ param: { id: String(id) }, json: patch });
    if (!res.ok) throw new Error(await errorMessage(res));
    const baby: Baby = await res.json();
    toast.success("已保存");
    // 仅刷新宝宝列表；当前宝宝的缓存由调用方用 BabyProvider 的 bound mutate 更新（key 一定匹配）
    await mutate(BABIES_KEY);
    return baby;
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "保存失败");
    return null;
  }
}

/** 删除宝宝（同时删除其所有记录） */
export async function deleteBaby(id: number, name: string): Promise<boolean> {
  try {
    const res = await api.babies[":id"].$delete({ param: { id: String(id) } });
    if (!res.ok) throw new Error(await errorMessage(res));
    toast.success(`已删除 ${name}宝宝`);
    await Promise.all([
      mutate(BABIES_KEY),
      mutate(BABY_KEY(name), null, { revalidate: false }),
    ]);
    return true;
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "删除失败");
    return false;
  }
}
