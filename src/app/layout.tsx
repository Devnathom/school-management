import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-sans-thai",
  subsets: ["thai", "latin"],
});

export const metadata: Metadata = {
  title: "ระบบบริหารจัดการโรงเรียน",
  description: "ระบบบริหารจัดการโรงเรียน: ข้อมูลครู นักเรียน ตารางเรียน งานพัสดุ งานสารบรรณ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${notoSansThai.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-noto-sans-thai)]">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
