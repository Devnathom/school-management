"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";

export function ConfirmDelete({
  action,
  itemLabel,
}: {
  /** Server Action ที่ bind id มาแล้ว คืน { error?: string } */
  action: () => Promise<{ error?: string } | void>;
  itemLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await action();
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(`ลบ${itemLabel}เรียบร้อย`);
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive">
          <Trash2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>ยืนยันการลบ</DialogTitle>
          <DialogDescription>
            ต้องการลบ{itemLabel}ใช่หรือไม่? การลบไม่สามารถย้อนกลับได้
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            ยกเลิก
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={pending}>
            {pending ? "กำลังลบ..." : "ลบ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
