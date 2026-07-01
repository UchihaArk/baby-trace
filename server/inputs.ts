import { z } from "zod";

export const activityTypeSchema = z.enum(["feed", "diaper", "sleep", "pump"]);

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

export const detailsSchema = z.union([
  feedDetailsSchema,
  diaperDetailsSchema,
  pumpDetailsSchema,
]);
export type LogDetails = FeedDetails | DiaperDetails | PumpDetails;

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
  avatarEmoji: z.string().min(1),
  avatarColor: z.enum(babyColorKeys),
});
export type CreateBabyInput = z.infer<typeof createBabySchema>;

export const updateBabySchema = createBabySchema.partial();
export type UpdateBabyInput = z.infer<typeof updateBabySchema>;
