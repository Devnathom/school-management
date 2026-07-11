"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleTimetableLock } from "@/lib/actions/timetable";
import { Lock, LockOpen } from "lucide-react";

export function LockToggle({ id, locked }: { id: string; locked: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon"
      className={locked ? "text-amber-600" : "text-muted-foreground"}
      title={locked ? "ปลดล็อกคาบนี้" : "ล็อกคาบนี้ (จัดอัตโนมัติจะไม่ย้าย/ลบ)"}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await toggleTimetableLock(id);
          if (result?.error) toast.error(result.error);
          else toast.success(locked ? "ปลดล็อกคาบแล้ว" : "ล็อกคาบแล้ว");
        })
      }
    >
      {locked ? <Lock className="size-4" /> : <LockOpen className="size-4" />}
    </Button>
  );
}
