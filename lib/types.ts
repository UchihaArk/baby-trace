// 前端共享类型（仅 type-only 重导出，避免把服务端运行时代码打进客户端 bundle）
import type { Baby as BabyRow, Gender, FeedingMethod } from "@/server/schema";

export type { Gender, FeedingMethod };
/**
 * 客户端看到的宝宝：服务端会剥离 accessCodeHash，改以 hasAccessCode 暴露，
 * 并附带 accessCodeVersion 用于判定本地解锁是否仍有效。
 */
export type Baby = Omit<BabyRow, "accessCodeHash"> & {
  hasAccessCode: boolean;
  accessCodeVersion: number;
};
export type { LogApi } from "@/server/lib";
export type { TodayStats, Summary, CareInterval, CareSummary, BucketAgg, TrendResponse } from "@/server/routes/stats";
export type { ActivityType, MeasurementKind, BabyMeasurement, BabyVaccine } from "@/server/schema";
export type {
  LogDetails,
  FeedDetails,
  DiaperDetails,
  PumpDetails,
  NailDetails,
  FoodDetails,
  CreateLogInput,
  UpdateLogInput,
  CreateBabyInput,
  UpdateBabyInput,
  CreateMeasurementInput,
  UpdateMeasurementInput,
  CreateVaccineInput,
  UpdateVaccineInput,
} from "@/server/inputs";
