export const DEPARTMENTS = [
  "ภาษาไทย",
  "คณิตศาสตร์",
  "วิทยาศาสตร์และเทคโนโลยี",
  "สังคมศึกษาฯ",
  "สุขศึกษาและพลศึกษา",
  "ศิลปะ",
  "การงานอาชีพ",
  "ภาษาต่างประเทศ",
];

export const TEACHER_PREFIXES = ["นาย", "นาง", "นางสาว", "ว่าที่ร้อยตรี", "ดร."];

export const STUDENT_PREFIXES = ["เด็กชาย", "เด็กหญิง", "นาย", "นางสาว"];

export const DAYS = [
  { value: 1, label: "จันทร์" },
  { value: 2, label: "อังคาร" },
  { value: 3, label: "พุธ" },
  { value: 4, label: "พฤหัสบดี" },
  { value: 5, label: "ศุกร์" },
];

export const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export const DEFAULT_PERIOD_TIMES = [
  { period: 1, startTime: "08:30", endTime: "09:20" },
  { period: 2, startTime: "09:20", endTime: "10:10" },
  { period: 3, startTime: "10:10", endTime: "11:00" },
  { period: 4, startTime: "11:00", endTime: "11:50" },
  { period: 5, startTime: "13:00", endTime: "13:50" },
  { period: 6, startTime: "13:50", endTime: "14:40" },
  { period: 7, startTime: "14:40", endTime: "15:30" },
  { period: 8, startTime: "15:30", endTime: "16:20" },
];

/** รวมเวลาจากฐานข้อมูลกับค่าเริ่มต้น (เผื่อคาบที่ยังไม่ได้ตั้ง) */
export function mergePeriodTimes(
  fromDb: { period: number; startTime: string; endTime: string }[]
) {
  return DEFAULT_PERIOD_TIMES.map(
    (d) => fromDb.find((t) => t.period === d.period) ?? d
  );
}

export function teacherName(t: {
  prefix: string;
  firstName: string;
  lastName: string;
}) {
  return `${t.prefix}${t.firstName} ${t.lastName}`;
}

export function thaiDate(d: Date | string) {
  return new Date(d).toLocaleDateString("th-TH", { dateStyle: "medium" });
}
