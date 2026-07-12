import type { Metadata, Viewport } from "next";
import { Sarabun } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SwRegister } from "@/components/sw-register";
import "./globals.css";

// ฟอนต์สารบรรณ (Sarabun) ใช้ทั้งระบบ ให้เข้าชุดกับเอกสาร PDF ที่ส่งออก
const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ระบบบริหารจัดการโรงเรียน",
  description: "ระบบบริหารจัดการโรงเรียน: ข้อมูลครู นักเรียน ตารางเรียน งานพัสดุ งานสารบรรณ",
  // สำหรับติดตั้งเป็นแอพบน iOS (Add to Home Screen)
  appleWebApp: {
    capable: true,
    title: "บริหารโรงเรียน",
    statusBarStyle: "default",
  },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    shortcut: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#171717",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${sarabun.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-sarabun)]">
        {children}
        <Toaster richColors position="top-right" />
        <SwRegister />
      </body>
    </html>
  );
}
