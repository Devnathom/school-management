import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit อ่านไฟล์ข้อมูลฟอนต์ผ่าน fs ต้องรันจาก node_modules ตรง ๆ ไม่ผ่าน bundler
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
