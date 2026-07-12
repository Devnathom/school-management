"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { promoteClass } from "@/lib/actions/promotion";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronsUp } from "lucide-react";

export function PromoteRow({
  sourceId,
  studentCount,
  targets,
}: {
  sourceId: string;
  studentCount: number;
  targets: { value: string; label: string }[];
}) {
  const [targetId, setTargetId] = useState("");
  const [pending, startTransition] = useTransition();

  function handlePromote() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("targetId", targetId);
      const result = await promoteClass(sourceId, formData);
      if (result.error) toast.error(result.error);
      else {
        toast.success(result.message ?? "เลื่อนชั้นเรียบร้อย");
        setTargetId("");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={targetId} onValueChange={setTargetId}>
        <SelectTrigger className="w-56">
          <SelectValue placeholder="เลือกห้องปลายทาง..." />
        </SelectTrigger>
        <SelectContent>
          {targets.map((t) => (
            <SelectItem key={t.value} value={t.value}>
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        className="gap-1"
        disabled={!targetId || pending || studentCount === 0}
        onClick={handlePromote}
      >
        <ChevronsUp className="size-4" />
        {pending ? "กำลังย้าย..." : `ย้าย ${studentCount} คน`}
      </Button>
    </div>
  );
}
