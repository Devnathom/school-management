"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { autoSchedule } from "@/lib/actions/assignments";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Sparkles, Eraser, PlusSquare } from "lucide-react";

export function AutoScheduleButton() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function run(mode: "clear" | "fill") {
    startTransition(async () => {
      const result = await autoSchedule(mode);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.message ?? "จัดตารางเรียบร้อย");
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Sparkles className="size-4" /> จัดตารางอัตโนมัติ
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>จัดตารางอัตโนมัติ</DialogTitle>
          <DialogDescription>
            ระบบจะจัดคาบสอนจากข้อมูลมอบหมายการสอนทุกห้องพร้อมกัน
            โดยรับประกันว่าครูไม่สอนซ้อนคาบ ห้องไม่มีวิชาซ้อนคาบ
            และพยายามกระจายวิชาเดียวกันไปคนละวัน
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Button
            className="w-full justify-start gap-2"
            disabled={pending}
            onClick={() => run("clear")}
          >
            <Eraser className="size-4" />
            ล้างตารางเดิม (ยกเว้นคาบที่ล็อก) แล้วจัดใหม่
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            disabled={pending}
            onClick={() => run("fill")}
          >
            <PlusSquare className="size-4" />
            คงคาบที่จัดไว้แล้ว จัดเติมเฉพาะที่ขาด
          </Button>
          {pending && (
            <p className="text-center text-sm text-muted-foreground">
              กำลังคำนวณตาราง...
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
