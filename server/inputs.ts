import { z } from "zod";

export const activityTypeSchema = z.enum(["feed", "diaper", "sleep", "pump", "bath", "haircut", "nail", "food"]);

/** 喂奶详情：奶瓶(毫升，母乳/奶粉) 或 亲喂(分钟，含侧别) */
export const feedDetailsSchema = z.object({
  method: z.enum(["bottle", "breast"]),
  milk: z.enum(["breastmilk", "formula"]).optional(),
  side: z.enum(["left", "right", "both"]).optional(),
});
export type FeedDetails = z.infer<typeof feedDetailsSchema>;

/** 尿布详情：wet 嘘嘘 / dirty 粑粑 / both 都有 */
export const diaperDetailsSchema = z.object({
  type: z.enum(["wet", "dirty", "both"]),
});
export type DiaperDetails = z.infer<typeof diaperDetailsSchema>;

/** 吸奶详情：含侧别 */
export const pumpDetailsSchema = z.object({
  side: z.enum(["left", "right", "both"]),
});
export type PumpDetails = z.infer<typeof pumpDetailsSchema>;

/** 剪指甲详情：手指 / 脚趾 / 都有 */
export const nailDetailsSchema = z.object({
  type: z.enum(["fingers", "toes", "both"]),
});
export type NailDetails = z.infer<typeof nailDetailsSchema>;

/** 辅食详情：食物名称（分类快捷填充或自定义） */
export const foodDetailsSchema = z.object({
  name: z.string().trim().min(1).max(40),
});
export type FoodDetails = z.infer<typeof foodDetailsSchema>;

const detailsSchema = z.union([
  feedDetailsSchema,
  diaperDetailsSchema,
  pumpDetailsSchema,
  nailDetailsSchema,
  foodDetailsSchema,
]);
export type LogDetails = FeedDetails | DiaperDetails | PumpDetails | NailDetails | FoodDetails;

/** 创建一条记录的入参（必须归属某个 baby） */
export const createLogSchema = z.object({
  babyId: z.number().int().positive(),
  activityType: activityTypeSchema,
  startTime: z.number().int().nonnegative(),
  endTime: z.number().int().nonnegative().nullable().optional(),
  amount: z.number().int().nonnegative().nullable().optional(),
  details: detailsSchema.nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});
export type CreateLogInput = z.infer<typeof createLogSchema>;

export const updateLogSchema = createLogSchema.partial();
export type UpdateLogInput = z.infer<typeof updateLogSchema>;

/** 睡眠开关入参 */
export const toggleSleepSchema = z.object({
  babyId: z.number().int().positive(),
});

// ── 身体测量（体重 / 身高 / 头围） ──────────────────────────────────────

export const measurementKindSchema = z.enum(["weight", "height", "head"]);

/** 创建一条测量记录的入参。
 *  valueGrams：体重存克（8200=8.2kg），身高/头围存毫米（680=68.0cm），统一整数。 */
export const createMeasurementSchema = z.object({
  babyId: z.number().int().positive(),
  kind: measurementKindSchema,
  measuredAt: z.number().int().nonnegative(),
  valueGrams: z.number().int().positive(),
  notes: z.string().max(500).nullable().optional(),
});
export type CreateMeasurementInput = z.infer<typeof createMeasurementSchema>;

export const updateMeasurementSchema = createMeasurementSchema.partial();
export type UpdateMeasurementInput = z.infer<typeof updateMeasurementSchema>;

// ── 疫苗接种记录 ────────────────────────────────────────────────────────

/** 创建一条疫苗接种记录的入参。dose 剂次可选（如「第 1 针」）。 */
export const createVaccineSchema = z.object({
  babyId: z.number().int().positive(),
  name: z.string().trim().min(1).max(40),
  dose: z.string().trim().max(20).nullable().optional(),
  vaccinatedAt: z.number().int().nonnegative(),
  notes: z.string().max(500).nullable().optional(),
});
export type CreateVaccineInput = z.infer<typeof createVaccineSchema>;

export const updateVaccineSchema = createVaccineSchema.partial();
export type UpdateVaccineInput = z.infer<typeof updateVaccineSchema>;

/** 宝宝档案 */
export const babyColorKeys = [
  "rose",
  "amber",
  "indigo",
  "teal",
  "violet",
  "sky",
  "emerald",
  "orange",
] as const;
export const createBabySchema = z.object({
  name: z.string().trim().min(1).max(20),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum(["male", "female", "other"]).optional(),
  feedingMethod: z.enum(["breast", "bottle"]).optional(),
  avatarEmoji: z.string().min(1),
  avatarColor: z.enum(babyColorKeys),
});
export type CreateBabyInput = z.infer<typeof createBabySchema>;

export const updateBabySchema = createBabySchema.partial();
export type UpdateBabyInput = z.infer<typeof updateBabySchema>;

/** 访问暗号：1–32 位，允许数字或任意文本 */
export const accessCodeSchema = z.object({
  code: z.string().trim().min(1).max(32),
});
export type AccessCodeInput = z.infer<typeof accessCodeSchema>;
