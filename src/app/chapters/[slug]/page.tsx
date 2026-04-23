import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DeleteMemberButton } from "./delete-member";

export default async function ChapterPage({
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
        orderBy: [{ pledgeClass: "asc" }, { firstName: "asc" }],
        include: {
          big: { select: { id: true, firstName: true, lastName: true } },
        },
      },
      memberships: {
        where: { userId: user.id },
        select: { role: true },
      },
      _count: { select: { members: true } },
    },
  });
  if (!chapter) notFound();
  const membership = chapter.memberships[0];
  if (!membership) notFound();
  const isAdmin = membership.role === "ADMIN";

  const byPledgeClass = new Map<string, typeof chapter.members>();
  for (const m of chapter.members) {
    const key = m.pledgeClass ?? "No pledge class";
    const arr = byPledgeClass.get(key) ?? [];
    arr.push(m);
    byPledgeClass.set(key, arr);
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            {chapter.school ?? "Chapter"}
          </div>
          <h1 className="text-3xl font-semibold">
            {chapter.fraternity} — {chapter.name}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {chapter._count.members} member
            {chapter._count.members === 1 ? "" : "s"} · You are{" "}
            <span className="font-medium">
              {membership.role.toLowerCase()}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/chapters/${chapter.slug}/tree`}
            className="rounded-full border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium"
          >
            View tree
          </Link>
          <Link
            href={`/chapters/${chapter.slug}/members/new`}
            className="rounded-full bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 px-4 py-2 text-sm font-medium"
          >
            + Add member
          </Link>
          <Link
            href={`/chapters/${chapter.slug}/members/bulk`}
            className="rounded-full border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium"
          >
            + Bulk add pledge class
          </Link>
          {isAdmin && (
            <Link
              href={`/chapters/${chapter.slug}/invites`}
              className="rounded-full border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium"
            >
              Invites
            </Link>
          )}
        </div>
      </div>

      {chapter.members.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-10 text-center text-zinc-600 dark:text-zinc-400">
          No members yet.{" "}
          <Link
            href={`/chapters/${chapter.slug}/members/bulk`}
            className="underline font-medium"
          >
            Add your pledge class
          </Link>{" "}
          to get started.
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {[...byPledgeClass.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([label, members]) => (
              <section key={label}>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 mb-2">
                  {label}
                </h2>
                <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                  {members.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-center justify-between gap-4 px-4 py-3"
                    >
                      <div>
                        <div className="font-medium">
                          {m.firstName} {m.lastName ?? ""}
                          {m.nickname ? (
                            <span className="text-zinc-500 ml-1">
                              &ldquo;{m.nickname}&rdquo;
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {m.big
                            ? `Big: ${m.big.firstName} ${m.big.lastName ?? ""}`
                            : "No big set"}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/chapters/${chapter.slug}/members/${m.id}/edit`}
                          className="text-sm underline"
                        >
                          Edit
                        </Link>
                        <DeleteMemberButton
                          chapterId={chapter.id}
                          memberId={m.id}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
        </div>
      )}
    </div>
  );
}
