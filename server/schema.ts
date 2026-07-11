import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/** 活动类型：feed 喂奶 / diaper 换尿布 / sleep 睡眠 / pump 吸奶 / bath 洗澡 / haircut 理发 / nail 剪指甲 */
export const activityTypes = ["feed", "diaper", "sleep", "pump", "bath", "haircut", "nail"] as const;
export type ActivityType = (typeof activityTypes)[number];

/** 测量种类：weight 体重 / height 身高。独立于活动日志，为后续头围等扩展预留。 */
export const measurementKinds = ["weight", "height"] as const;
export type MeasurementKind = (typeof measurementKinds)[number];

/** 性别 */
export const genders = ["male", "female", "other"] as const;
export type Gender = (typeof genders)[number];

/**
 * babies —— 宝宝档案
 * - name：乳名，同时作为 URL 标识（唯一）
 * - birth_date：ISO 日期字符串 "YYYY-MM-DD"
 * - avatar_emoji / avatar_color：头像 emoji + 主题色 key
 * - access_code_hash：访问暗号的 `salt.hash`（SHA-256），null 表示未设置
 * - access_code_version：暗号版本，每次设置/修改/关闭自增，用于让客户端旧解锁失效
 */
export const babies = sqliteTable("babies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  birthDate: text("birth_date").notNull(),
  gender: text("gender", { enum: genders }),
  avatarEmoji: text("avatar_emoji").notNull(),
  avatarColor: text("avatar_color").notNull(),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
  accessCodeHash: text("access_code_hash"),
  accessCodeVersion: integer("access_code_version", { mode: "number" }).notNull().default(0),
});

/**
 * baby_logs —— 活动记录（按 baby_id 归属某个宝宝）
 * - start_time / end_time：Unix 秒。睡眠进行中时 end_time 为 null。
 * - amount：奶瓶=毫升；亲喂=分钟；吸奶=毫升。
 * - details：JSON 字符串。
 */
export const babyLogs = sqliteTable("baby_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  babyId: integer("baby_id", { mode: "number" }).notNull().references(() => babies.id),
  activityType: text("activity_type", { enum: activityTypes }).notNull(),
  startTime: integer("start_time", { mode: "number" }).notNull(),
  endTime: integer("end_time", { mode: "number" }),
  amount: integer("amount", { mode: "number" }),
  details: text("details"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
});

/**
 * baby_measurements —— 身体测量记录（体重 / 身高，独立于活动日志）
 * - kind：测量种类。
 * - measured_at：Unix 秒（测量时刻）。
 * - value_grams：统一整数存储。体重存克（8200 = 8.2kg），身高存毫米（680 = 68.0cm）。
 *   复用同一列避免拆表；kind 决定单位语义。
 */
export const babyMeasurements = sqliteTable("baby_measurements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  babyId: integer("baby_id", { mode: "number" }).notNull().references(() => babies.id),
  kind: text("kind", { enum: measurementKinds }).notNull(),
  measuredAt: integer("measured_at", { mode: "number" }).notNull(),
  valueGrams: integer("value_grams", { mode: "number" }).notNull(),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
});

/**
 * baby_vaccines —— 疫苗接种记录（独立于活动日志，纯接种清单）
 * - name：疫苗名称（自由文本，如「乙肝疫苗」）。
 * - dose：剂次（自由文本，如「第 1 针」「加强针」），可空。
 * - vaccinated_at：接种时间（Unix 秒）。
 * 同一疫苗多针 = 多条记录，按 vaccinated_at 正序即接种历史。
 */
export const babyVaccines = sqliteTable("baby_vaccines", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  babyId: integer("baby_id", { mode: "number" }).notNull().references(() => babies.id),
  name: text("name").notNull(),
  dose: text("dose"),
  vaccinatedAt: integer("vaccinated_at", { mode: "number" }).notNull(),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
});

export type Baby = typeof babies.$inferSelect;
export type NewBaby = typeof babies.$inferInsert;
export type BabyLog = typeof babyLogs.$inferSelect;
export type NewBabyLog = typeof babyLogs.$inferInsert;
export type BabyMeasurement = typeof babyMeasurements.$inferSelect;
export type NewBabyMeasurement = typeof babyMeasurements.$inferInsert;
export type BabyVaccine = typeof babyVaccines.$inferSelect;
export type NewBabyVaccine = typeof babyVaccines.$inferInsert;
