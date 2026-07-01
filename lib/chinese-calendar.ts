import { Solar } from "lunar-typescript";

export type BirthExtras = { zodiac: string; shengxiao: string; lunar: string };

/** 由公历出生日期(YYYY-MM-DD)推导：星座 / 属相 / 农历年月日。无效日期返回 null。 */
export function getBirthExtras(birthDate: string): BirthExtras | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!m) return null;
  const solar = Solar.fromYmd(Number(m[1]), Number(m[2]), Number(m[3]));
  const lunar = solar.getLunar();
  return {
    zodiac: solar.getXingZuo() + "座",
    shengxiao: lunar.getYearShengXiao(),
    lunar: `${lunar.getYearInGanZhi()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
  };
}
