import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // ---------- ครู ----------
  const teacherData = [
    { prefix: "นาย", firstName: "สมชาย", lastName: "ใจดี", position: "ครูชำนาญการพิเศษ", department: "คณิตศาสตร์", phone: "081-111-1111", email: "somchai@school.local" },
    { prefix: "นาง", firstName: "สมหญิง", lastName: "รักเรียน", position: "ครูชำนาญการ", department: "ภาษาไทย", phone: "081-222-2222", email: "somying@school.local" },
    { prefix: "นางสาว", firstName: "วิภา", lastName: "แสงทอง", position: "ครู", department: "ภาษาต่างประเทศ", phone: "081-333-3333", email: "wipa@school.local" },
    { prefix: "นาย", firstName: "ประวิทย์", lastName: "เก่งกล้า", position: "ครูชำนาญการ", department: "วิทยาศาสตร์และเทคโนโลยี", phone: "081-444-4444", email: "prawit@school.local" },
    { prefix: "นาง", firstName: "อรุณี", lastName: "ศรีสุข", position: "ครู", department: "สังคมศึกษาฯ", phone: "081-555-5555", email: "arunee@school.local" },
    { prefix: "นาย", firstName: "ธนกร", lastName: "พลศึกษา", position: "ครูผู้ช่วย", department: "สุขศึกษาและพลศึกษา", phone: "081-666-6666", email: "thanakorn@school.local" },
    { prefix: "นางสาว", firstName: "จินตนา", lastName: "ศิลป์งาม", position: "ครู", department: "ศิลปะ", phone: "081-777-7777", email: "jintana@school.local" },
    { prefix: "นาย", firstName: "อนุชา", lastName: "ช่างคิด", position: "ครู", department: "การงานอาชีพ", phone: "081-888-8888", email: "anucha@school.local" },
  ];
  const teachers = [];
  for (const t of teacherData) {
    teachers.push(await prisma.teacher.create({ data: t }));
  }

  // ---------- ผู้ใช้งาน ----------
  await prisma.user.create({
    data: {
      email: "admin@school.local",
      passwordHash: await bcrypt.hash("admin1234", 10),
      role: "ADMIN",
    },
  });
  await prisma.user.create({
    data: {
      email: "somchai@school.local",
      passwordHash: await bcrypt.hash("teacher1234", 10),
      role: "TEACHER",
      teacherId: teachers[0].id,
    },
  });

  // ---------- ห้องเรียน ----------
  const year = "2569";
  const room11 = await prisma.classRoom.create({
    data: { name: "ม.1/1", year, homeroomTeacherId: teachers[0].id },
  });
  const room12 = await prisma.classRoom.create({
    data: { name: "ม.1/2", year, homeroomTeacherId: teachers[1].id },
  });
  const room21 = await prisma.classRoom.create({
    data: { name: "ม.2/1", year, homeroomTeacherId: teachers[2].id },
  });

  // ---------- นักเรียน ----------
  const firstNames = ["กิตติ", "ณัฐพล", "ธีรภัทร", "พงศกร", "ภูมิพัฒน์", "รัชชานนท์", "ศุภกร", "อภิวัฒน์", "กมลชนก", "จิราภรณ์", "ชนิดา", "ณิชา", "ธิดารัตน์", "นภัสสร", "พิมพ์ชนก", "วรรณิดา", "ศศิธร", "สุพิชญา", "อารยา", "เบญจมาศ", "ปวีณา", "มนัสนันท์", "ลลิตา", "วิภาวี"],
    lastNames = ["ใจงาม", "สุขสันต์", "แก้วใส", "ทองดี", "ศรีวิไล", "บุญมา", "คำหอม", "พูลสวัสดิ์"];
  const rooms = [room11, room12, room21];
  for (let i = 0; i < 24; i++) {
    const isFemale = i >= 8;
    await prisma.student.create({
      data: {
        studentCode: String(10001 + i),
        prefix: isFemale ? "เด็กหญิง" : "เด็กชาย",
        firstName: firstNames[i],
        lastName: lastNames[i % lastNames.length],
        classRoomId: rooms[i % 3].id,
      },
    });
  }

  // ---------- รายวิชา ----------
  const subjectData = [
    { code: "ค21101", name: "คณิตศาสตร์พื้นฐาน", department: "คณิตศาสตร์" },
    { code: "ท21101", name: "ภาษาไทยพื้นฐาน", department: "ภาษาไทย" },
    { code: "อ21101", name: "ภาษาอังกฤษพื้นฐาน", department: "ภาษาต่างประเทศ" },
    { code: "ว21101", name: "วิทยาศาสตร์พื้นฐาน", department: "วิทยาศาสตร์และเทคโนโลยี" },
    { code: "ส21101", name: "สังคมศึกษา", department: "สังคมศึกษาฯ" },
    { code: "พ21101", name: "สุขศึกษาและพลศึกษา", department: "สุขศึกษาและพลศึกษา" },
    { code: "ศ21101", name: "ศิลปะ", department: "ศิลปะ" },
    { code: "ง21101", name: "การงานอาชีพ", department: "การงานอาชีพ" },
  ];
  const subjects = [];
  for (const s of subjectData) {
    subjects.push(await prisma.subject.create({ data: s }));
  }

  // ---------- ตารางเรียน (ม.1/1 และ ม.1/2 สลับครูไม่ให้ชนกัน) ----------
  // subjects[i] สอนโดย teachers[i] (จัดกลุ่มสาระตรงกัน)
  const entries: { classRoomId: string; subjectId: string; teacherId: string; dayOfWeek: number; period: number }[] = [];
  for (let day = 1; day <= 5; day++) {
    for (let period = 1; period <= 4; period++) {
      const idxA = (day + period) % 8;
      const idxB = (day + period + 4) % 8; // ห่างกัน 4 → ไม่ชนกับห้องแรกแน่นอน
      entries.push({ classRoomId: room11.id, subjectId: subjects[idxA].id, teacherId: teachers[idxA].id, dayOfWeek: day, period });
      entries.push({ classRoomId: room12.id, subjectId: subjects[idxB].id, teacherId: teachers[idxB].id, dayOfWeek: day, period });
    }
  }
  await prisma.timetableEntry.createMany({ data: entries });

  // ---------- มอบหมายการสอน (ใช้กับระบบจัดตารางอัตโนมัติ) ----------
  // subjects[i] สอนโดย teachers[i]: วิชาหลัก 4 คาบ/สัปดาห์ วิชารอง 2 คาบ/สัปดาห์
  const assignmentData = [];
  for (const room of rooms) {
    for (let i = 0; i < subjects.length; i++) {
      assignmentData.push({
        classRoomId: room.id,
        subjectId: subjects[i].id,
        teacherId: teachers[i].id,
        periodsPerWeek: i < 4 ? 4 : 2,
      });
    }
  }
  await prisma.teachingAssignment.createMany({ data: assignmentData });

  // ---------- พัสดุ ----------
  const items = await Promise.all([
    prisma.inventoryItem.create({ data: { code: "MAT-001", name: "กระดาษ A4 80 แกรม", category: "วัสดุสำนักงาน", unit: "รีม", quantity: 0, minStock: 20 } }),
    prisma.inventoryItem.create({ data: { code: "MAT-002", name: "ปากกาไวท์บอร์ด", category: "วัสดุสำนักงาน", unit: "ด้าม", quantity: 0, minStock: 30 } }),
    prisma.inventoryItem.create({ data: { code: "MAT-003", name: "หมึกพิมพ์ HP 682", category: "วัสดุคอมพิวเตอร์", unit: "ตลับ", quantity: 0, minStock: 5 } }),
    prisma.inventoryItem.create({ data: { code: "MAT-004", name: "แฟ้มเอกสาร A4", category: "วัสดุสำนักงาน", unit: "แฟ้ม", quantity: 0, minStock: 10 } }),
    prisma.inventoryItem.create({ data: { code: "EQP-001", name: "เครื่องฉายโปรเจคเตอร์", category: "ครุภัณฑ์", unit: "เครื่อง", quantity: 0, minStock: 1 } }),
    prisma.inventoryItem.create({ data: { code: "MAT-005", name: "ชอล์กสีขาว", category: "วัสดุการเรียนการสอน", unit: "กล่อง", quantity: 0, minStock: 15 } }),
  ]);

  const txs: { itemId: string; type: string; quantity: number; requester?: string; note?: string }[] = [
    { itemId: items[0].id, type: "IN", quantity: 100, note: "จัดซื้อประจำภาคเรียน 1/2569" },
    { itemId: items[0].id, type: "OUT", quantity: 30, requester: "นางสมหญิง รักเรียน", note: "งานวิชาการ" },
    { itemId: items[1].id, type: "IN", quantity: 50, note: "จัดซื้อประจำภาคเรียน 1/2569" },
    { itemId: items[1].id, type: "OUT", quantity: 25, requester: "นายสมชาย ใจดี" },
    { itemId: items[2].id, type: "IN", quantity: 6, note: "จัดซื้อ" },
    { itemId: items[2].id, type: "OUT", quantity: 3, requester: "งานธุรการ" },
    { itemId: items[3].id, type: "IN", quantity: 40 },
    { itemId: items[4].id, type: "IN", quantity: 3, note: "งบลงทุน 2569" },
    { itemId: items[5].id, type: "IN", quantity: 10 },
  ];
  for (const tx of txs) {
    await prisma.inventoryTransaction.create({ data: tx });
    await prisma.inventoryItem.update({
      where: { id: tx.itemId },
      data: { quantity: { [tx.type === "IN" ? "increment" : "decrement"]: tx.quantity } },
    });
  }

  // ---------- หนังสือรับ ----------
  const thaiYear = 2569;
  await prisma.incomingDocument.createMany({
    data: [
      { regNo: 1, year: thaiYear, docNo: "ศธ 04001/ว123", docDate: new Date("2026-05-18"), fromOrg: "สพม.เขต 1", subject: "ขอเชิญประชุมผู้บริหารสถานศึกษา", action: "แจ้งผู้อำนวยการ", status: "DONE" },
      { regNo: 2, year: thaiYear, docNo: "ศธ 04001/ว145", docDate: new Date("2026-06-02"), fromOrg: "สพม.เขต 1", subject: "การอบรมเชิงปฏิบัติการครูผู้สอนวิทยาการคำนวณ", action: "แจ้งกลุ่มสาระวิทยาศาสตร์ฯ", status: "DONE" },
      { regNo: 3, year: thaiYear, docNo: "อว 0601/2456", docDate: new Date("2026-07-01"), fromOrg: "มหาวิทยาลัยราชภัฏ", subject: "ขอความอนุเคราะห์รับนักศึกษาฝึกประสบการณ์วิชาชีพครู", action: "", status: "PENDING" },
    ],
  });

  // ---------- หนังสือส่ง ----------
  await prisma.outgoingDocument.createMany({
    data: [
      { regNo: 1, year: thaiYear, toOrg: "สพม.เขต 1", subject: "รายงานข้อมูลนักเรียนรายบุคคล ภาคเรียนที่ 1/2569", docDate: new Date("2026-06-10") },
      { regNo: 2, year: thaiYear, toOrg: "เทศบาลตำบลบ้านใหม่", subject: "ขอความอนุเคราะห์รถรับ-ส่งนักเรียนกิจกรรมทัศนศึกษา", docDate: new Date("2026-06-25") },
    ],
  });

  // ---------- จดหมายเวียน ----------
  const circular = await prisma.circular.create({
    data: {
      title: "แจ้งกำหนดการประชุมครูประจำเดือนกรกฎาคม 2569",
      body: "ขอเชิญคณะครูทุกท่านเข้าร่วมประชุมประจำเดือน ในวันศุกร์ที่ 17 กรกฎาคม 2569 เวลา 15.30 น. ณ ห้องประชุมโรงเรียน โปรดกดรับทราบในระบบ",
    },
  });
  await prisma.circularAck.create({
    data: { circularId: circular.id, teacherId: teachers[1].id },
  });

  console.log("Seed เสร็จสิ้น: ครู 8, นักเรียน 24, ห้องเรียน 3, วิชา 8, ตาราง 40 คาบ");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
