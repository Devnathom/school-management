# ระบบบริหารจัดการโรงเรียน (School Management System)

เว็บแอพบริหารงานโรงเรียนสำหรับงานธุรการและวิชาการ พัฒนาด้วย Next.js เวอร์ชันล่าสุด รองรับภาษาไทยทั้งระบบ

## ฟีเจอร์

- **แดชบอร์ด** — สรุปจำนวนครู/นักเรียน/ห้องเรียน หนังสือรับค้างดำเนินการ พัสดุใกล้หมด และจดหมายเวียนล่าสุด
- **ข้อมูลครู / นักเรียน / ห้องเรียน / รายวิชา** — เพิ่ม แก้ไข ลบ พร้อมกรองนักเรียนตามห้อง
- **ตารางเรียน / ตารางสอน** — จัดคาบสอน (จันทร์–ศุกร์ × 8 คาบ) ดูได้ทั้งมุมมองรายห้องและรายครู
  พร้อม**ตรวจคาบชนอัตโนมัติ** (ครูสอนซ้อนคาบ / ห้องเรียนมีวิชาซ้อนคาบ) ทั้งระดับแอพและระดับฐานข้อมูล
- **จัดตารางอัตโนมัติ (อัจฉริยะ)** — กำหนดมอบหมายการสอน (ห้อง × วิชา × ครู × คาบ/สัปดาห์)
  แล้วให้ constraint solver (backtracking + MRV heuristic + random restart) จัดตารางทุกห้องพร้อมกัน
  รับประกันไม่มีคาบชน และกระจายวิชาเดียวกันไปคนละวัน — เลือกได้ทั้งล้างจัดใหม่ทั้งหมด หรือคงคาบเดิมแล้วจัดเติมเฉพาะที่ขาด
- **ล็อกคาบ** — ปักหมุดคาบสำคัญ (เช่น ลูกเสือ/ชุมนุม) ระบบจัดอัตโนมัติจะไม่ย้ายและไม่ลบคาบที่ล็อกไว้
- **ส่งออก PDF / Excel** — รายชื่อครู, รายชื่อนักเรียน (ตามห้องหรือทั้งหมด), ตารางเรียนรายห้อง และตารางสอนรายครู
  (PDF ฝังฟอนต์ไทย Sarabun, Excel จัดรูปแบบหัวตารางพร้อมเส้นขอบ)
- **งานพัสดุ** — ทะเบียนพัสดุ บันทึกรับเข้า/เบิกจ่าย ยอดคงเหลืออัตโนมัติ แจ้งเตือนต่ำกว่าจุดสั่งซื้อ
- **งานสารบรรณ**
  - ทะเบียนหนังสือรับ / หนังสือส่ง — ออกเลขทะเบียนต่อเนื่องภายในปี พ.ศ. ให้อัตโนมัติ
  - จดหมายเวียน — เวียนถึงครูทุกท่าน ครูกดรับทราบได้ และผู้ดูแลเห็นรายชื่อผู้รับทราบ
- **ระบบสิทธิ์** — ผู้ดูแลระบบ (ADMIN) จัดการข้อมูลได้ทั้งหมด, ครู (TEACHER) ดูข้อมูล เบิกพัสดุ และกดรับทราบจดหมายเวียน

## เทคโนโลยี

| ส่วน | เทคโนโลยี |
|---|---|
| Framework | Next.js 16 (App Router, Server Components, Server Actions) + TypeScript |
| UI | Tailwind CSS v4 + shadcn/ui |
| ฐานข้อมูล | PostgreSQL + Prisma ORM 7 (driver adapter pg) |
| PWA | ติดตั้งบนมือถือ/เดสก์ท็อปได้ (manifest + service worker + หน้า offline) |
| Authentication | Auth.js (NextAuth v5) — credentials + role-based access |
| Validation | Zod |

## การติดตั้ง

ต้องมี Node.js 20 ขึ้นไป และ PostgreSQL 14 ขึ้นไป

```bash
git clone https://github.com/Devnathom/school-management.git
cd school-management
npm install

# สร้างฐานข้อมูลใน PostgreSQL
createdb school_management_app

# ตั้งค่า environment (แก้ DATABASE_URL ให้ตรงกับเครื่องของคุณ)
cp .env.example .env

# สร้างตาราง + ข้อมูลตัวอย่าง
npx prisma migrate dev
npx prisma db seed

# รันเซิร์ฟเวอร์
npm run dev
```

เปิด http://localhost:3000

> หากใช้งานจริง ให้เปลี่ยน `AUTH_SECRET` ใน `.env` เป็นค่าสุ่มใหม่ (สร้างได้ด้วย `npx auth secret`)

## บัญชีทดสอบ

| บทบาท | อีเมล | รหัสผ่าน |
|---|---|---|
| ผู้ดูแลระบบ | `admin@school.local` | `admin1234` |
| ครู | `somchai@school.local` | `teacher1234` |

## โครงสร้างโปรเจกต์

```
src/
  app/
    login/                  หน้าเข้าสู่ระบบ
    (app)/                  เลย์เอาต์หลัก (sidebar + ตรวจ session)
      dashboard/            แดชบอร์ด
      teachers/ students/ classes/ subjects/
      timetable/            ตารางเรียน/ตารางสอน
      inventory/            งานพัสดุ
      documents/            หนังสือรับ / หนังสือส่ง / จดหมายเวียน
  components/               คอมโพเนนต์ใช้ร่วม (EntityFormDialog, ConfirmDelete ฯลฯ)
  lib/
    actions/                Server Actions + Zod schema แยกตามโมดูล
    auth.ts guard.ts prisma.ts
prisma/
  schema.prisma seed.ts
```
