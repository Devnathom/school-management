"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
    }
    throw error; // NEXT_REDIRECT ต้องโยนต่อ
  }
}
