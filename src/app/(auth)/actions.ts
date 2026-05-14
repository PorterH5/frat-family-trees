"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const credsSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(200),
  name: z.string().min(1).max(100).optional(),
});

export type AuthState = {
  error?: string;
};

export async function signupAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = credsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name") || undefined,
  });
  if (!parsed.success) {
    return { error: "Please enter a valid email and password (8+ chars)." };
  }
  const { email, password, name } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists." };
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, name: name ?? null, passwordHash },
  });
  const session = await getSession();
  session.userId = user.id;
  await session.save();

  const inviteToken = formData.get("invite");
  if (typeof inviteToken === "string" && inviteToken) {
    redirect(`/invite/${inviteToken}`);
  }
  redirect("/dashboard");
}

export async function signinAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = credsSchema
    .pick({ email: true, password: true })
    .safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
  if (!parsed.success) {
    return { error: "Please enter a valid email and password." };
  }
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Invalid email or password." };
  }
  const session = await getSession();
  session.userId = user.id;
  await session.save();

  const inviteToken = formData.get("invite");
  if (typeof inviteToken === "string" && inviteToken) {
    redirect(`/invite/${inviteToken}`);
  }
  redirect("/dashboard");
}

export async function signoutAction() {
  const session = await getSession();
  session.destroy();
  redirect("/");
}
