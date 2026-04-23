import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser, requireChapterMembership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildForest } from "@/lib/tree";
import { TreeView } from "./tree-view";

export default async function TreePage({
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

  const forest = buildForest(chapter.members);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mx-auto max-w-5xl w-full px-6 pt-6 pb-2 flex items-center justify-between">
        <div>
          <Link
            href={`/chapters/${chapter.slug}`}
            className="text-sm text-zinc-500 hover:underline"
          >
            ← Back to chapter
          </Link>
          <h1 className="text-2xl font-semibold mt-1">
            {chapter.fraternity} — {chapter.name} family trees
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {forest.length} famil{forest.length === 1 ? "y" : "ies"} ·{" "}
            {chapter.members.length} members. Drag to pan, scroll to zoom.
          </p>
        </div>
      </div>
      <div className="flex-1 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        {forest.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-500">
            No members yet.
          </div>
        ) : (
          <TreeView forest={forest} />
        )}
      </div>
    </div>
  );
}
