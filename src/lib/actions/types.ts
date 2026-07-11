export type ActionResult = { error?: string };

export function toError(e: unknown): { error: string } {
  return { error: e instanceof Error ? e.message : "เกิดข้อผิดพลาด" };
}
