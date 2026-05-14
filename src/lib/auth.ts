import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { getSession } from "./session";

export async function getCurrentUser() {
  const session = await getSession();
  if (!session.userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true },
  });
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/signin");
  }
  return user;
}

export async function requireChapterMembership(
  userId: string,
  chapterId: string,
) {
  const membership = await prisma.chapterMembership.findUnique({
    where: { chapterId_userId: { chapterId, userId } },
  });
  if (!membership) {
    throw new Error("You are not a member of this chapter");
  }
  return membership;
}
