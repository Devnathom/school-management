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
