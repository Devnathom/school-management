"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "select" | "textarea" | "date" | "number";
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
};

export function EntityFormDialog({
  title,
  description,
  fields,
  action,
  defaultValues = {},
  trigger,
}: {
  title: string;
  description?: string;
  fields: FieldDef[];
  /** Server Action ที่ bind id มาแล้ว */
  action: (formData: FormData) => Promise<{ error?: string }>;
  defaultValues?: Record<string, string>;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await action(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("บันทึกข้อมูลเรียบร้อย");
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          {fields.map((f) => (
            <div key={f.name} className="space-y-2">
              <Label htmlFor={f.name}>
                {f.label}
                {f.required && <span className="text-destructive"> *</span>}
              </Label>
              {f.type === "select" ? (
                <Select
                  name={f.name}
                  defaultValue={defaultValues[f.name] || undefined}
                >
                  <SelectTrigger id={f.name} className="w-full">
                    <SelectValue placeholder={f.placeholder ?? "เลือก..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {f.options?.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : f.type === "textarea" ? (
                <Textarea
                  id={f.name}
                  name={f.name}
                  required={f.required}
                  placeholder={f.placeholder}
                  defaultValue={defaultValues[f.name]}
                  rows={4}
                />
              ) : (
                <Input
                  id={f.name}
                  name={f.name}
                  type={f.type ?? "text"}
                  required={f.required}
                  placeholder={f.placeholder}
                  defaultValue={defaultValues[f.name]}
                />
              )}
            </div>
          ))}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
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
