/**
 * 身体测量数值的单位换算与格式化。
 * 存储：体重存克（integer）、身高存毫米（integer）；展示：kg / cm。
 * 复用 metrics.ts 中 formatMl 的「整数存储 + 智能展示」范式。
 */

/** 克 → kg 展示：8200 → "8.2 kg" */
export function formatWeight(grams: number): string {
  return `${formatKg(grams)} kg`;
}

/** 克 → kg 数值字符串（不含单位）：8200 → "8.2"，8500 → "8.5" */
export function formatKg(grams: number): string {
  return (Math.max(0, Math.round(grams)) / 1000).toFixed(1);
}

/** 毫米 → cm 展示：680 → "68.0 cm" */
export function formatHeight(mm: number): string {
  return `${formatCm(mm)} cm`;
}

/** 毫米 → cm 数值字符串（不含单位）：680 → "68.0" */
export function formatCm(mm: number): string {
  return (Math.max(0, Math.round(mm)) / 10).toFixed(1);
}

/** kg 字符串 → 克整数："8.2" → 8200。非法返回 null。 */
export function kgToGrams(input: string): number | null {
  const kg = Number(input);
  if (!Number.isFinite(kg) || kg < 0) return null;
  return Math.round(kg * 1000);
}

/** cm 字符串 → 毫米整数："68.0" → 680。非法返回 null。 */
export function cmToMm(input: string): number | null {
  const cm = Number(input);
  if (!Number.isFinite(cm) || cm < 0) return null;
  return Math.round(cm * 10);
}

/** 克 → kg（数值，非字符串） */
export const gramsToKg = (grams: number): number => grams / 1000;
/** 毫米 → cm（数值，非字符串） */
export const mmToCm = (mm: number): number => mm / 10;
