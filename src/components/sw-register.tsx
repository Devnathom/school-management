"use client";

import { useEffect } from "react";

export function SwRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      // ห้ามใช้ SW ตอน dev: cache-first จะเสิร์ฟ chunk เก่าทับโค้ดใหม่
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
      });
      if ("caches" in window) {
        caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
      }
      return;
    }

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(() => {
        // ลงทะเบียนไม่ได้ ไม่กระทบการใช้งานปกติ
      });
  }, []);
  return null;
}
