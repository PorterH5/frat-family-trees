/**
 * Smoke test: exercises the DB layer and tree-building logic.
 * Run with: npx tsx scripts/smoke-test.ts
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { buildForest } from "../src/lib/tree";

async function main() {
  const email = `smoke-${Date.now()}@example.com`;
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash("password123", 10),
      name: "Smoke Test",
    },
  });
  console.log("✓ created user", user.email);

  const chapter = await prisma.chapter.create({
    data: {
      slug: `smoke-${Date.now()}`,
      name: "Alpha",
      fraternity: "Sigma Smoke",
      school: "Test University",
      createdById: user.id,
      memberships: { create: { userId: user.id, role: "ADMIN" } },
    },
  });
  console.log("✓ created chapter", chapter.slug);

  const founder = await prisma.member.create({
    data: {
      chapterId: chapter.id,
      firstName: "Alpha",
      lastName: "Founder",
      pledgeClass: "Fall 1950",
      createdById: user.id,
    },
  });
  const bigA = await prisma.member.create({
    data: {
      chapterId: chapter.id,
      firstName: "Big",
      lastName: "A",
      pledgeClass: "Fall 2020",
      bigId: founder.id,
      createdById: user.id,
    },
  });
  const littleA = await prisma.member.create({
    data: {
      chapterId: chapter.id,
      firstName: "Little",
      lastName: "A",
      pledgeClass: "Fall 2023",
      bigId: bigA.id,
      createdById: user.id,
    },
  });
  const secondRoot = await prisma.member.create({
    data: {
      chapterId: chapter.id,
      firstName: "Second",
      lastName: "Root",
      pledgeClass: "Fall 1960",
      createdById: user.id,
    },
  });
  console.log("✓ created 4 members");

  const members = await prisma.member.findMany({
    where: { chapterId: chapter.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      nickname: true,
      pledgeClass: true,
      bigId: true,
    },
  });
  const forest = buildForest(members);
  if (forest.length !== 2) {
    throw new Error(`Expected 2 root families, got ${forest.length}`);
  }
  const founderRoot = forest.find((r) => r.memberId === founder.id);
  if (!founderRoot || !founderRoot.children || founderRoot.children.length !== 1) {
    throw new Error("Founder should have 1 direct child (bigA)");
  }
  const bigANode = founderRoot.children[0];
  if (!bigANode.children || bigANode.children.length !== 1) {
    throw new Error("bigA should have 1 child (littleA)");
  }
  console.log("✓ tree shape correct:", JSON.stringify(forest, null, 2));

  // Invite + accept
  const invite = await prisma.invite.create({
    data: {
      chapterId: chapter.id,
      token: `tok-${Date.now()}`,
      role: "MEMBER",
      createdById: user.id,
    },
  });
  console.log("✓ created invite", invite.token);

  const other = await prisma.user.create({
    data: {
      email: `other-${Date.now()}@example.com`,
      passwordHash: await bcrypt.hash("password123", 10),
    },
  });
  await prisma.chapterMembership.create({
    data: { chapterId: chapter.id, userId: other.id, role: invite.role },
  });
  await prisma.invite.update({
    where: { id: invite.id },
    data: { uses: { increment: 1 } },
  });
  const memberships = await prisma.chapterMembership.findMany({
    where: { chapterId: chapter.id },
  });
  if (memberships.length !== 2) {
    throw new Error(`Expected 2 memberships, got ${memberships.length}`);
  }
  console.log("✓ invite accepted, 2 memberships");

  // Cleanup — cascade deletes memberships/members/invites via Chapter cascade.
  await prisma.chapter.delete({ where: { id: chapter.id } });
  await prisma.user.delete({ where: { id: user.id } });
  await prisma.user.delete({ where: { id: other.id } });
  console.log("✓ cleanup done");

  await prisma.$disconnect();
  console.log("\nAll smoke tests passed.");
  process.exit(0);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
