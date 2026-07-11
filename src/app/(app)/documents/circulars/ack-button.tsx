"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { acknowledgeCircular } from "@/lib/actions/documents";
import { CheckCircle2 } from "lucide-react";

export function AckButton({ circularId }: { circularId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      className="gap-1.5"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await acknowledgeCircular(circularId);
          if (result?.error) toast.error(result.error);
          else toast.success("บันทึกการรับทราบเรียบร้อย");
        })
      }
    >
      <CheckCircle2 className="size-4" />
      {pending ? "กำลังบันทึก..." : "รับทราบ"}
    </Button>
  );
}
