export type SplitInput = {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM 24h
  endTime: string; // HH:MM 24h
  isPublicHoliday?: boolean;
  isDesignatedDayOff?: boolean;
};

const NIGHT_START_MIN = 21 * 60; // 21:00
const NIGHT_END_MIN = 7 * 60; // 07:00

export function isValidDateYmd(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function isValidTimeHm(value: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(value)) return false;
  const [h, m] = value.split(":").map(Number);
  return h >= 0 && h < 24 && m >= 0 && m < 60;
}

function hmToMinutes(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

function isSunday(dateYmd: string): boolean {
  const [y, mo, d] = dateYmd.split("-").map(Number);
  const dt = new Date(y, mo - 1, d);
  return dt.getDay() === 0; // Sunday
}

export function computeOvertimeSplit(input: SplitInput): { minutes150: number; minutes200: number; totalMinutes: number } {
  if (!isValidDateYmd(input.date)) throw new Error("Invalid date");
  if (!isValidTimeHm(input.startTime) || !isValidTimeHm(input.endTime)) throw new Error("Invalid time");
  const start = hmToMinutes(input.startTime);
  const end = hmToMinutes(input.endTime);
  if (!(end > start)) throw new Error("end must be after start on the same day");

  const total = end - start;

  const all200 = Boolean(input.isPublicHoliday || input.isDesignatedDayOff || isSunday(input.date));
  if (all200) {
    return { minutes150: 0, minutes200: total, totalMinutes: total };
  }

  // Night window spans across midnight: [21:00,24:00) U [00:00,07:00)
  const overlapNight = overlapMinutes(start, end, NIGHT_START_MIN, 24 * 60) + overlapMinutes(start, end, 0, NIGHT_END_MIN);
  const minutes200 = Math.max(0, Math.min(total, overlapNight));
  const minutes150 = total - minutes200;
  return { minutes150, minutes200, totalMinutes: total };
}

function overlapMinutes(aStart: number, aEnd: number, bStart: number, bEnd: number): number {
  const start = Math.max(aStart, bStart);
  const end = Math.min(aEnd, bEnd);
  return Math.max(0, end - start);
}


