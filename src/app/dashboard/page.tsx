import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const user = await requireUser();
  const memberships = await prisma.chapterMembership.findMany({
    where: { userId: user.id },
    include: {
      chapter: {
        include: { _count: { select: { members: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your chapters</h1>
        <Link
          href="/chapters/new"
          className="rounded-full bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 px-4 py-2 text-sm font-medium"
        >
          + New chapter
        </Link>
      </div>
      {memberships.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-10 text-center text-zinc-600 dark:text-zinc-400">
          You&apos;re not in any chapters yet.
          <div className="mt-3">
            <Link
              href="/chapters/new"
              className="underline font-medium"
            >
              Create your first chapter
            </Link>{" "}
            or use an invite link from a brother.
          </div>
        </div>
      ) : (
        <ul className="mt-6 grid sm:grid-cols-2 gap-4">
          {memberships.map((m) => (
            <li
              key={m.id}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4"
            >
              <Link
                href={`/chapters/${m.chapter.slug}`}
                className="font-medium hover:underline"
              >
                {m.chapter.fraternity} — {m.chapter.name}
              </Link>
              <div className="text-xs text-zinc-500 mt-1">
                {m.chapter.school ?? "No school set"} ·{" "}
                {m.chapter._count.members} members · {m.role.toLowerCase()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
