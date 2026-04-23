import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser, requireChapterMembership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MemberForm } from "../member-form";

export default async function NewMemberPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
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
        },
      },
    },
  });
  if (!chapter) notFound();
  await requireChapterMembership(user.id, chapter.id);

  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      <Link
        href={`/chapters/${chapter.slug}`}
        className="text-sm text-zinc-500 hover:underline"
      >
        ← Back to {chapter.fraternity} — {chapter.name}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Add a member</h1>
      <div className="mt-6">
        <MemberForm
          chapterId={chapter.id}
          members={chapter.members}
          mode="create"
        />
      </div>
    </div>
  );
}
