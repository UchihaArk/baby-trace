import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/** 活动类型：feed 喂奶 / diaper 换尿布 / sleep 睡眠 / pump 吸奶 / bath 洗澡 / haircut 理发 / nail 剪指甲 */
export const activityTypes = ["feed", "diaper", "sleep", "pump", "bath", "haircut", "nail"] as const;
export type ActivityType = (typeof activityTypes)[number];

/** 性别 */
export const genders = ["male", "female", "other"] as const;
export type Gender = (typeof genders)[number];

/**
 * babies —— 宝宝档案
 * - name：乳名，同时作为 URL 标识（唯一）
 * - birth_date：ISO 日期字符串 "YYYY-MM-DD"
 * - avatar_emoji / avatar_color：头像 emoji + 主题色 key
 */
export const babies = sqliteTable("babies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  birthDate: text("birth_date").notNull(),
  gender: text("gender", { enum: genders }),
  avatarEmoji: text("avatar_emoji").notNull(),
  avatarColor: text("avatar_color").notNull(),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
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

export type Baby = typeof babies.$inferSelect;
export type NewBaby = typeof babies.$inferInsert;
export type BabyLog = typeof babyLogs.$inferSelect;
export type NewBabyLog = typeof babyLogs.$inferInsert;
