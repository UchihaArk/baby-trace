import type { Baby, BabyLog } from "./schema";
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

// ── 访问暗号（哈希存储，不明文落库、不外泄） ──────────────────────────

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** 生成随机 salt 并返回 `${salt}.${hash}` 用于落库 */
export async function hashAccessCode(code: string): Promise<string> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const salt = [...saltBytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${salt}.${await sha256Hex(`${salt}:${code}`)}`;
}

/** 比对落库的 `${salt}.${hash}` 与明文暗号是否匹配 */
export async function verifyAccessCode(stored: string, code: string): Promise<boolean> {
  const dot = stored.indexOf(".");
  if (dot <= 0) return false;
  const salt = stored.slice(0, dot);
  return (await sha256Hex(`${salt}:${code}`)) === stored.slice(dot + 1);
}

// ── 对外宝宝形态（剥离 hash，改以 hasAccessCode 暴露） ────────────────

export type BabyPublic = Omit<Baby, "accessCodeHash"> & {
  hasAccessCode: boolean;
  accessCodeVersion: number;
};

/** DB 行 → API 对象：确保 access_code_hash 永不外泄 */
export function toPublicBaby(row: Baby): BabyPublic {
  const { accessCodeHash, ...rest } = row;
  return { ...rest, hasAccessCode: !!accessCodeHash, accessCodeVersion: row.accessCodeVersion };
}
