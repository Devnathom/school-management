"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { savePeriodTimes } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Clock } from "lucide-react";

export function PeriodTimesDialog({
  times,
}: {
  times: { period: number; startTime: string; endTime: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await savePeriodTimes(formData);
      if (result?.error) toast.error(result.error);
      else {
        toast.success("บันทึกเวลาเรียนเรียบร้อย");
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Clock className="size-4" /> ตั้งเวลาเรียน
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>เวลาเริ่ม-จบของแต่ละคาบ</DialogTitle>
          <DialogDescription>
            เวลาจะแสดงในหัวตารางเรียน/ตารางสอน และไฟล์ที่ส่งออก
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-2">
          {times.map((t) => (
            <div key={t.period} className="flex items-center gap-2">
              <span className="w-14 shrink-0 text-sm font-medium">
                คาบ {t.period}
              </span>
              <Input
                type="time"
                name={`start-${t.period}`}
                defaultValue={t.startTime}
                required
                className="flex-1"
              />
              <span className="text-muted-foreground">–</span>
              <Input
                type="time"
                name={`end-${t.period}`}
                defaultValue={t.endTime}
                required
                className="flex-1"
              />
            </div>
          ))}
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
