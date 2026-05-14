import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser, requireChapterMembership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BulkAddForm } from "./form";

export default async function BulkAddPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireUser();
  const chapter = await prisma.chapter.findUnique({ where: { slug } });
  if (!chapter) notFound();
  await requireChapterMembership(user.id, chapter.id);

  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      <Link
        href={`/chapters/${chapter.slug}`}
        className="text-sm text-zinc-500 hover:underline"
      >
        ← Back to {chapter.fraternity} — {chapter.name}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Bulk add a pledge class</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Paste one name per line. You can optionally specify a nickname in
        parentheses and a big after a dash, e.g.:
      </p>
      <pre className="mt-2 rounded bg-zinc-100 dark:bg-zinc-900 text-xs p-3 overflow-x-auto">
{`John Smith
Mike "Spider" Johnson (Spider)
David Lee - Big: John Smith`}
      </pre>
      <div className="mt-6">
        <BulkAddForm chapterId={chapter.id} />
      </div>
    </div>
  );
}
