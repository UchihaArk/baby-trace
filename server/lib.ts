import type { BabyLog } from "./schema";
import type { LogDetails } from "./inputs";

/** 对外 API 返回的记录类型（details 已解析为对象） */
export type LogApi = Omit<BabyLog, "details"> & { details: LogDetails | null };

/** 把 DB 里的 JSON 字符串解析回对象，失败则返回 null */
export function parseDetails(details: string | null): LogDetails | null {
  if (!details) return null;
  try {
    return JSON.parse(details) as LogDetails;
  } catch {
    return null;
  }
}

/** DB 行 → API 对象 */
export function toLog(row: BabyLog): LogApi {
  const { details, ...rest } = row;
  return { ...rest, details: parseDetails(details) };
}

/** 当前 Unix 秒 */
export const nowSec = () => Math.floor(Date.now() / 1000);
