// อัลกอริทึมจัดตารางเรียน/ตารางสอนอัตโนมัติ (constraint solver)
//
// เงื่อนไขบังคับ (hard constraints):
//   1. ครูหนึ่งคนสอนได้ครั้งละหนึ่งห้องต่อคาบ
//   2. ห้องเรียนหนึ่งห้องเรียนได้ครั้งละหนึ่งวิชาต่อคาบ
// เงื่อนไขเสริม (soft constraint):
//   - กระจายคาบของวิชาเดียวกันไปคนละวัน ไม่ให้กระจุกอยู่วันเดียว
//
// วิธี: backtracking + MRV (เลือกหน่วยที่เหลือช่องน้อยสุดก่อน) + random restart

export type ScheduleUnit = {
  classRoomId: string;
  subjectId: string;
  teacherId: string;
};

export type ScheduleEntry = ScheduleUnit & {
  dayOfWeek: number;
  period: number;
};

export type AssignmentInput = ScheduleUnit & { periodsPerWeek: number };

export type ScheduleResult = {
  placed: ScheduleEntry[];
  unplaced: ScheduleUnit[];
};

type Slot = { day: number; period: number };

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateSchedule({
  assignments,
  fixed = [],
  days = [1, 2, 3, 4, 5],
  periods = [1, 2, 3, 4, 5, 6, 7, 8],
  maxRestarts = 80,
  maxNodesPerRestart = 150_000,
}: {
  assignments: AssignmentInput[];
  /** คาบที่จัดไว้แล้วและต้องคงไว้ (โหมดจัดเติมช่องว่าง) */
  fixed?: ScheduleEntry[];
  days?: number[];
  periods?: number[];
  maxRestarts?: number;
  maxNodesPerRestart?: number;
}): ScheduleResult {
  const slots: Slot[] = days.flatMap((day) =>
    periods.map((period) => ({ day, period }))
  );

  // นับคาบที่จัดไว้แล้วของแต่ละ (ห้อง, วิชา) เพื่อหักออกจากจำนวนที่ต้องจัด
  const fixedCount = new Map<string, number>();
  for (const f of fixed) {
    const key = `${f.classRoomId}|${f.subjectId}`;
    fixedCount.set(key, (fixedCount.get(key) ?? 0) + 1);
  }

  // แตก assignment เป็นหน่วยย่อย หน่วยละ 1 คาบ
  const units: ScheduleUnit[] = [];
  for (const a of assignments) {
    const already = fixedCount.get(`${a.classRoomId}|${a.subjectId}`) ?? 0;
    const needed = Math.max(0, a.periodsPerWeek - already);
    for (let i = 0; i < needed; i++) {
      units.push({
        classRoomId: a.classRoomId,
        subjectId: a.subjectId,
        teacherId: a.teacherId,
      });
    }
  }
  if (units.length === 0) return { placed: [], unplaced: [] };

  // ภาระงานสอนรวมของครูแต่ละคน ใช้จัดลำดับ: ครูที่งานแน่นสุดจัดก่อน
  const teacherLoad = new Map<string, number>();
  for (const u of units) {
    teacherLoad.set(u.teacherId, (teacherLoad.get(u.teacherId) ?? 0) + 1);
  }

  let best: ScheduleResult = { placed: [], unplaced: units };

  for (let restart = 0; restart < maxRestarts; restart++) {
    const rand = mulberry32(restart * 7919 + 1);

    const ordered = shuffle(units, rand).sort(
      (a, b) => (teacherLoad.get(b.teacherId) ?? 0) - (teacherLoad.get(a.teacherId) ?? 0)
    );

    const classBusy = new Set<string>();
    const teacherBusy = new Set<string>();
    const subjectDay = new Map<string, number>(); // `${class}|${subject}|${day}` -> count
    for (const f of fixed) {
      classBusy.add(`${f.classRoomId}|${f.dayOfWeek}|${f.period}`);
      teacherBusy.add(`${f.teacherId}|${f.dayOfWeek}|${f.period}`);
      const sd = `${f.classRoomId}|${f.subjectId}|${f.dayOfWeek}`;
      subjectDay.set(sd, (subjectDay.get(sd) ?? 0) + 1);
    }

    const placed: ScheduleEntry[] = [];
    let nodes = 0;
    let aborted = false;

    const candidatesFor = (u: ScheduleUnit): Slot[] => {
      const free = slots.filter(
        (s) =>
          !classBusy.has(`${u.classRoomId}|${s.day}|${s.period}`) &&
          !teacherBusy.has(`${u.teacherId}|${s.day}|${s.period}`)
      );
      // soft constraint: วันที่ยังไม่มีวิชานี้มาก่อนดีที่สุด
      return shuffle(free, rand).sort(
        (a, b) =>
          (subjectDay.get(`${u.classRoomId}|${u.subjectId}|${a.day}`) ?? 0) -
          (subjectDay.get(`${u.classRoomId}|${u.subjectId}|${b.day}`) ?? 0)
      );
    };

    const backtrack = (remaining: ScheduleUnit[]): boolean => {
      if (remaining.length === 0) return true;
      if (++nodes > maxNodesPerRestart) {
        aborted = true;
        return false;
      }

      // MRV: เลือกหน่วยที่มีช่องว่างเหลือน้อยที่สุดก่อน
      let bestIdx = 0;
      let bestCands: Slot[] | null = null;
      for (let i = 0; i < remaining.length; i++) {
        const cands = candidatesFor(remaining[i]);
        if (bestCands === null || cands.length < bestCands.length) {
          bestIdx = i;
          bestCands = cands;
          if (cands.length === 0) break;
        }
      }
      const unit = remaining[bestIdx];
      if (!bestCands || bestCands.length === 0) return false;

      const rest = remaining.filter((_, i) => i !== bestIdx);
      for (const slot of bestCands) {
        const ck = `${unit.classRoomId}|${slot.day}|${slot.period}`;
        const tk = `${unit.teacherId}|${slot.day}|${slot.period}`;
        const sd = `${unit.classRoomId}|${unit.subjectId}|${slot.day}`;

        classBusy.add(ck);
        teacherBusy.add(tk);
        subjectDay.set(sd, (subjectDay.get(sd) ?? 0) + 1);
        placed.push({ ...unit, dayOfWeek: slot.day, period: slot.period });

        if (backtrack(rest)) return true;

        placed.pop();
        classBusy.delete(ck);
        teacherBusy.delete(tk);
        subjectDay.set(sd, (subjectDay.get(sd) ?? 1) - 1);
        if (aborted) return false;
      }
      return false;
    };

    const solved = backtrack(ordered);
    if (solved) return { placed, unplaced: [] };

    if (placed.length > best.placed.length) {
      // เก็บผลลัพธ์ที่จัดได้เยอะสุดไว้เผื่อจัดครบไม่ได้จริง ๆ
      const placedCopy = [...placed];
      const usedCount = new Map<string, number>();
      for (const p of placedCopy) {
        const k = `${p.classRoomId}|${p.subjectId}`;
        usedCount.set(k, (usedCount.get(k) ?? 0) + 1);
      }
      const unplaced: ScheduleUnit[] = [];
      for (const u of units) {
        const k = `${u.classRoomId}|${u.subjectId}`;
        const left = usedCount.get(k) ?? 0;
        if (left > 0) usedCount.set(k, left - 1);
        else unplaced.push(u);
      }
      best = { placed: placedCopy, unplaced };
    }
  }

  return best;
}
