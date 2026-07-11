import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/** ใช้ในหน้า/เลย์เอาต์: ถ้ายังไม่ล็อกอินให้เด้งไปหน้า login */
export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

/** ใช้ใน Server Action ที่แก้ไขข้อมูล: อนุญาตเฉพาะ ADMIN */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("กรุณาเข้าสู่ระบบ");
  if (session.user.role !== "ADMIN") throw new Error("เฉพาะผู้ดูแลระบบเท่านั้น");
  return session;
}
