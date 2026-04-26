"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, requireChapterMembership } from "@/lib/auth";
import { makeSlug } from "@/lib/slug";

const chapterSchema = z.object({
  fraternity: z.string().min(1).max(100),
  name: z.string().min(1).max(100),
  school: z.string().max(200).optional(),
});

export type ChapterState = { error?: string };

export async function createChapterAction(
  _prev: ChapterState,
  formData: FormData,
): Promise<ChapterState> {
  const user = await requireUser();
  const parsed = chapterSchema.safeParse({
    fraternity: formData.get("fraternity"),
    name: formData.get("name"),
    school: formData.get("school") || undefined,
  });
  if (!parsed.success) {
    return { error: "Please fill out the fraternity and chapter name." };
  }
  const { fraternity, name, school } = parsed.data;

  let slug = makeSlug(fraternity, name, school ?? "");
  let attempt = 0;
  while (await prisma.chapter.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = makeSlug(fraternity, name, school ?? "") + "-" + nanoid(4);
    if (attempt > 5) break;
  }

  const chapter = await prisma.chapter.create({
    data: {
      slug,
      name,
      fraternity,
      school: school ?? null,
      createdById: user.id,
      memberships: {
        create: { userId: user.id, role: "ADMIN" },
      },
    },
  });
  redirect(`/chapters/${chapter.slug}`);
}

const memberSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).optional(),
  nickname: z.string().max(100).optional(),
  pledgeClass: z.string().max(50).optional(),
  bigId: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

export type MemberState = { error?: string };

export async function createMemberAction(
  chapterId: string,
  _prev: MemberState,
  formData: FormData,
): Promise<MemberState> {
  const user = await requireUser();
  await requireChapterMembership(user.id, chapterId);
  const parsed = memberSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName") || undefined,
    nickname: formData.get("nickname") || undefined,
    pledgeClass: formData.get("pledgeClass") || undefined,
    bigId: formData.get("bigId") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { error: "Please enter a first name." };
  }
  const data = parsed.data;
  if (data.bigId) {
    const big = await prisma.member.findUnique({
      where: { id: data.bigId },
      select: { chapterId: true, pledgeClass: true },
    });
    if (!big || big.chapterId !== chapterId) {
      return { error: "Selected big is not in this chapter." };
    }
    if (
      data.pledgeClass &&
      big.pledgeClass &&
      big.pledgeClass.trim().toLowerCase() ===
        data.pledgeClass.trim().toLowerCase()
    ) {
      return {
        error: "A big must be from a different pledge class.",
      };
    }
  }
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: { slug: true },
  });
  if (!chapter) return { error: "Chapter not found." };

  await prisma.member.create({
    data: {
      chapterId,
      firstName: data.firstName,
      lastName: data.lastName ?? null,
      nickname: data.nickname ?? null,
      pledgeClass: data.pledgeClass ?? null,
      bigId: data.bigId ?? null,
      notes: data.notes ?? null,
      createdById: user.id,
    },
  });
  revalidatePath(`/chapters/${chapter.slug}`);
  revalidatePath(`/chapters/${chapter.slug}/tree`);
  redirect(`/chapters/${chapter.slug}`);
}

const updateMemberSchema = memberSchema.extend({
  memberId: z.string().min(1),
});

export async function updateMemberAction(
  chapterId: string,
  _prev: MemberState,
  formData: FormData,
): Promise<MemberState> {
  const user = await requireUser();
  await requireChapterMembership(user.id, chapterId);
  const parsed = updateMemberSchema.safeParse({
    memberId: formData.get("memberId"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName") || undefined,
    nickname: formData.get("nickname") || undefined,
    pledgeClass: formData.get("pledgeClass") || undefined,
    bigId: formData.get("bigId") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { error: "Please enter a valid first name." };
  }
  const { memberId, ...data } = parsed.data;
  const existing = await prisma.member.findUnique({ where: { id: memberId } });
  if (!existing || existing.chapterId !== chapterId) {
    return { error: "Member not found in this chapter." };
  }
  if (data.bigId) {
    if (data.bigId === memberId) {
      return { error: "A member cannot be their own big." };
    }
    const big = await prisma.member.findUnique({
      where: { id: data.bigId },
      select: { chapterId: true, pledgeClass: true },
    });
    if (!big || big.chapterId !== chapterId) {
      return { error: "Selected big is not in this chapter." };
    }
    if (
      data.pledgeClass &&
      big.pledgeClass &&
      big.pledgeClass.trim().toLowerCase() ===
        data.pledgeClass.trim().toLowerCase()
    ) {
      return {
        error: "A big must be from a different pledge class.",
      };
    }
  }
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: { slug: true },
  });
  if (!chapter) return { error: "Chapter not found." };

  await prisma.member.update({
    where: { id: memberId },
    data: {
      firstName: data.firstName,
      lastName: data.lastName ?? null,
      nickname: data.nickname ?? null,
      pledgeClass: data.pledgeClass ?? null,
      bigId: data.bigId ?? null,
      notes: data.notes ?? null,
    },
  });
  revalidatePath(`/chapters/${chapter.slug}`);
  revalidatePath(`/chapters/${chapter.slug}/tree`);
  redirect(`/chapters/${chapter.slug}`);
}

export async function deleteMemberAction(
  chapterId: string,
  formData: FormData,
) {
  const user = await requireUser();
  await requireChapterMembership(user.id, chapterId);
  const memberId = formData.get("memberId");
  if (typeof memberId !== "string") return;
  const existing = await prisma.member.findUnique({ where: { id: memberId } });
  if (!existing || existing.chapterId !== chapterId) return;

  // Re-parent any littles so we don't leave orphaned foreign keys.
  await prisma.member.updateMany({
    where: { bigId: memberId },
    data: { bigId: existing.bigId ?? null },
  });
  await prisma.member.delete({ where: { id: memberId } });
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: { slug: true },
  });
  if (chapter) {
    revalidatePath(`/chapters/${chapter.slug}`);
    revalidatePath(`/chapters/${chapter.slug}/tree`);
  }
}

const bulkSchema = z.object({
  pledgeClass: z.string().min(1).max(50),
  names: z.string().min(1),
  bigAssignments: z.string().optional(),
});

export type BulkState = { error?: string; added?: number };

/**
 * Parse one name per line. Supports formats:
 *   "First Last"
 *   "First Last, Nickname"
 *   "First Last (Nickname)"
 *   "First Last - Big: Big Name"  // optional big linking
 */
function parseBulkNames(input: string): Array<{
  firstName: string;
  lastName: string | null;
  nickname: string | null;
  bigName: string | null;
}> {
  const out: Array<{
    firstName: string;
    lastName: string | null;
    nickname: string | null;
    bigName: string | null;
  }> = [];
  const lines = input
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  for (const raw of lines) {
    let line = raw;
    let bigName: string | null = null;
    const bigMatch = line.match(/\s*-\s*big\s*:\s*(.+)$/i);
    if (bigMatch) {
      bigName = bigMatch[1].trim();
      line = line.slice(0, bigMatch.index).trim();
    }
    let nickname: string | null = null;
    const parenMatch = line.match(/\s*\(([^)]+)\)\s*$/);
    if (parenMatch) {
      nickname = parenMatch[1].trim();
      line = line.slice(0, parenMatch.index).trim();
    } else if (line.includes(",")) {
      const [namePart, nick] = line.split(",");
      line = namePart.trim();
      nickname = (nick ?? "").trim() || null;
    }
    const parts = line.split(/\s+/);
    const firstName = parts.shift() ?? "";
    const lastName = parts.length ? parts.join(" ") : null;
    if (!firstName) continue;
    out.push({ firstName, lastName, nickname, bigName });
  }
  return out;
}

export async function bulkAddPledgeClassAction(
  chapterId: string,
  _prev: BulkState,
  formData: FormData,
): Promise<BulkState> {
  const user = await requireUser();
  await requireChapterMembership(user.id, chapterId);
  const parsed = bulkSchema.safeParse({
    pledgeClass: formData.get("pledgeClass"),
    names: formData.get("names"),
  });
  if (!parsed.success) {
    return { error: "Please enter a pledge class label and at least one name." };
  }
  const { pledgeClass, names } = parsed.data;
  const parsedNames = parseBulkNames(names);
  if (parsedNames.length === 0) {
    return { error: "Couldn't parse any names from the list." };
  }
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: { slug: true },
  });
  if (!chapter) return { error: "Chapter not found." };

  // Only resolve big-by-name references against members in OTHER pledge
  // classes — a big must come from an earlier class.
  const normalizedPledgeClass = pledgeClass.trim().toLowerCase();
  const existing = await prisma.member.findMany({
    where: { chapterId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      nickname: true,
      pledgeClass: true,
    },
  });
  const byName = new Map<string, string>();
  for (const m of existing) {
    if (
      (m.pledgeClass ?? "").trim().toLowerCase() === normalizedPledgeClass
    ) {
      continue;
    }
    const full = [m.firstName, m.lastName].filter(Boolean).join(" ").toLowerCase();
    byName.set(full, m.id);
    if (m.nickname) byName.set(m.nickname.toLowerCase(), m.id);
  }

  for (const n of parsedNames) {
    const bigId =
      n.bigName && byName.get(n.bigName.toLowerCase())
        ? byName.get(n.bigName.toLowerCase())!
        : null;
    await prisma.member.create({
      data: {
        chapterId,
        firstName: n.firstName,
        lastName: n.lastName,
        nickname: n.nickname,
        pledgeClass,
        bigId,
        createdById: user.id,
      },
    });
  }

  revalidatePath(`/chapters/${chapter.slug}`);
  revalidatePath(`/chapters/${chapter.slug}/tree`);
  redirect(`/chapters/${chapter.slug}`);
}

const inviteSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
  maxUses: z.coerce.number().int().min(1).max(10000).optional(),
  expiresInDays: z.coerce.number().int().min(1).max(365).optional(),
});

export async function createInviteAction(
  chapterId: string,
  formData: FormData,
) {
  const user = await requireUser();
  const membership = await requireChapterMembership(user.id, chapterId);
  if (membership.role !== "ADMIN") {
    throw new Error("Only admins can create invite links.");
  }
  const parsed = inviteSchema.safeParse({
    role: formData.get("role") || "MEMBER",
    maxUses: formData.get("maxUses") || undefined,
    expiresInDays: formData.get("expiresInDays") || undefined,
  });
  if (!parsed.success) {
    throw new Error("Invalid invite options.");
  }
  const { role, maxUses, expiresInDays } = parsed.data;
  const token = nanoid(24);
  await prisma.invite.create({
    data: {
      chapterId,
      token,
      role,
      maxUses: maxUses ?? null,
      expiresAt: expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 3600 * 1000)
        : null,
      createdById: user.id,
    },
  });
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: { slug: true },
  });
  if (chapter) revalidatePath(`/chapters/${chapter.slug}/invites`);
}

export async function revokeInviteAction(
  chapterId: string,
  formData: FormData,
) {
  const user = await requireUser();
  const membership = await requireChapterMembership(user.id, chapterId);
  if (membership.role !== "ADMIN") {
    throw new Error("Only admins can revoke invite links.");
  }
  const inviteId = formData.get("inviteId");
  if (typeof inviteId !== "string") return;
  const invite = await prisma.invite.findUnique({ where: { id: inviteId } });
  if (!invite || invite.chapterId !== chapterId) return;
  await prisma.invite.delete({ where: { id: inviteId } });
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: { slug: true },
  });
  if (chapter) revalidatePath(`/chapters/${chapter.slug}/invites`);
}

export async function acceptInviteAction(token: string) {
  const user = await requireUser();
  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { chapter: true },
  });
  if (!invite) throw new Error("Invite not found.");
  if (invite.expiresAt && invite.expiresAt < new Date()) {
    throw new Error("This invite has expired.");
  }
  if (invite.maxUses && invite.uses >= invite.maxUses) {
    throw new Error("This invite has been used up.");
  }

  const existing = await prisma.chapterMembership.findUnique({
    where: {
      chapterId_userId: { chapterId: invite.chapterId, userId: user.id },
    },
  });
  if (!existing) {
    await prisma.chapterMembership.create({
      data: {
        chapterId: invite.chapterId,
        userId: user.id,
        role: invite.role,
      },
    });
    await prisma.invite.update({
      where: { id: invite.id },
      data: { uses: { increment: 1 } },
    });
  }
  redirect(`/chapters/${invite.chapter.slug}`);
}
