import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser, requireChapterMembership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MemberForm } from "../../member-form";

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ slug: string; memberId: string }>;
}) {
  const { slug, memberId } = await params;
  const user = await requireUser();
  const chapter = await prisma.chapter.findUnique({
    where: { slug },
    include: {
      members: {
        orderBy: [{ firstName: "asc" }],
        select: {
          id: true,
          firstName: true,
          lastName: true,
          nickname: true,
          pledgeClass: true,
          bigId: true,
        },
      },
    },
  });
  if (!chapter) notFound();
  await requireChapterMembership(user.id, chapter.id);

  const existing = await prisma.member.findUnique({ where: { id: memberId } });
  if (!existing || existing.chapterId !== chapter.id) notFound();

  const pledgeClasses = Array.from(
    new Set(
      chapter.members
        .map((m) => m.pledgeClass?.trim())
        .filter((v): v is string => !!v),
    ),
  ).sort((a, b) => a.localeCompare(b));

  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      <Link
        href={`/chapters/${chapter.slug}`}
        className="text-sm text-zinc-500 hover:underline"
      >
        ← Back to {chapter.fraternity} — {chapter.name}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Edit member</h1>
      <div className="mt-6">
        <MemberForm
          chapterId={chapter.id}
          members={chapter.members}
          pledgeClasses={pledgeClasses}
          chapterSlug={chapter.slug}
          mode="edit"
          existing={existing}
        />
      </div>
    </div>
  );
}
