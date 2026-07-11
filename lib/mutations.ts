"use client";

import { mutate } from "swr";
import { toast } from "sonner";
import { api } from "./api-client";
import { notifyLogsMutated } from "./log-events";
import { BABIES_KEY, BABY_KEY, MEASUREMENTS_KEY, RECENT_KEY, RECENT_LIMIT } from "./hooks";
import { nowSec } from "./time";
import type {
  Baby,
  BabyMeasurement,
  CreateBabyInput,
  CreateLogInput,
  CreateMeasurementInput,
  LogApi,
  MeasurementKind,
  UpdateBabyInput,
  UpdateLogInput,
  UpdateMeasurementInput,
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

// ── 身体测量（体重 / 身高） ──────────────────────────────────────────

/** 失效某宝宝所有种类的测量缓存 */
const revalidateMeasurements = (babyId: number) =>
  mutate((k) => typeof k === "string" && k.startsWith(`measurements:${babyId}:`));

/** 新建测量（乐观）：立即插入到对应 kind 的升序列表末尾 */
export async function createMeasurement(
  babyId: number,
  input: CreateMeasurementInput
): Promise<BabyMeasurement | null> {
  const kind = input.kind as MeasurementKind;
  const temp: BabyMeasurement = {
    id: tmpId(),
    babyId,
    kind,
    measuredAt: input.measuredAt,
    valueGrams: input.valueGrams,
    notes: input.notes ?? null,
    createdAt: nowSec(),
  };
  const key = MEASUREMENTS_KEY(babyId, kind);
  await mutate(key, (list?: BabyMeasurement[]) => [...(list ?? []), temp], { revalidate: false });

  try {
    const res = await api.measurements.$post({ json: input });
    if (!res.ok) throw new Error(await errorMessage(res));
    const created: BabyMeasurement = await res.json();
    toast.success("已记录 ✓");
    await revalidateMeasurements(babyId);
    return created;
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "保存失败");
    await revalidateMeasurements(babyId);
    return null;
  }
}

/** 编辑测量（乐观）。
 *  注意：测量值/时间/备注的编辑不涉及 kind 变更，乐观更新作用于「编辑前 kind」的列表；
 *  极少出现的 kind 互改（体重↔身高）由后端成功后的 revalidateMeasurements 兜底全量刷新。 */
export async function updateMeasurement(
  id: number,
  babyId: number,
  kind: MeasurementKind,
  patch: UpdateMeasurementInput
): Promise<boolean> {
  const key = MEASUREMENTS_KEY(babyId, kind);
  await mutate(
    key,
    (list?: BabyMeasurement[]) => list?.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    { revalidate: false }
  );

  try {
    const res = await api.measurements[":id"].$patch({ param: { id: String(id) }, json: patch });
    if (!res.ok) throw new Error(await errorMessage(res));
    toast.success("已更新 ✓");
    await revalidateMeasurements(babyId);
    return true;
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "更新失败");
    await revalidateMeasurements(babyId);
    return false;
  }
}

/** 删除测量（乐观） */
export async function deleteMeasurement(id: number, babyId: number, kind: MeasurementKind): Promise<boolean> {
  const key = MEASUREMENTS_KEY(babyId, kind);
  await mutate(key, (list?: BabyMeasurement[]) => list?.filter((m) => m.id !== id), {
    revalidate: false,
  });

  try {
    const res = await api.measurements[":id"].$delete({ param: { id: String(id) } });
    if (!res.ok) throw new Error(await errorMessage(res));
    toast.success("已删除");
    await revalidateMeasurements(babyId);
    return true;
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "删除失败");
    await revalidateMeasurements(babyId);
    return false;
  }
}

// ── 访问暗号 ──────────────────────────────────────────────────────────

/** 设置/修改访问暗号。返回更新后的宝宝（调用方需据此 markUnlocked 保持当前会话可访问） */
export async function setBabyAccessCode(id: number, code: string): Promise<Baby | null> {
  try {
    const res = await api.babies[":id"]["access-code"].$put({
      param: { id: String(id) },
      json: { code },
    });
    if (!res.ok) throw new Error(await errorMessage(res));
    const baby: Baby = await res.json();
    toast.success("访问暗号已设置，再次进入需输入暗号");
    // 仅刷新列表缓存；当前宝宝缓存交由调用方在 markUnlocked 之后再更新，
    // 避免先出现「已设暗号但尚未解锁」的一瞬锁屏闪烁。
    await revalidateBabies();
    return baby;
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "设置失败");
    return null;
  }
}

/** 关闭访问暗号 */
export async function clearBabyAccessCode(id: number): Promise<boolean> {
  try {
    const res = await api.babies[":id"]["access-code"].$delete({ param: { id: String(id) } });
    if (!res.ok) throw new Error(await errorMessage(res));
    toast.success("已关闭访问暗号");
    await revalidateBabies();
    return true;
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "关闭失败");
    return false;
  }
}

/** 校验访问暗号；仅返回是否正确，失败不弹 toast（由锁屏内联提示） */
export async function verifyBabyAccessCode(id: number, code: string): Promise<boolean> {
  try {
    const res = await api.babies[":id"]["verify-code"].$post({
      param: { id: String(id) },
      json: { code },
    });
    return res.ok;
  } catch {
    return false;
  }
}
