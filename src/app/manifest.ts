import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ระบบบริหารจัดการโรงเรียน",
    short_name: "บริหารโรงเรียน",
    description:
      "ระบบบริหารจัดการโรงเรียน: ข้อมูลครู นักเรียน ตารางเรียน งานพัสดุ งานสารบรรณ",
    lang: "th",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#171717",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
