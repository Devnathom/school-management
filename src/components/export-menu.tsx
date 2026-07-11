import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText } from "lucide-react";

/** ปุ่มส่งออกไฟล์: baseHref คือ API export (จะเติม format ให้เอง) */
export function ExportMenu({ baseHref }: { baseHref: string }) {
  const sep = baseHref.includes("?") ? "&" : "?";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="size-4" /> ส่งออก
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <a href={`${baseHref}${sep}format=pdf`}>
            <FileText className="size-4" /> ไฟล์ PDF
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={`${baseHref}${sep}format=xlsx`}>
            <FileSpreadsheet className="size-4" /> ไฟล์ Excel
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
