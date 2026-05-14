import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser, requireChapterMembership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createInviteAction, revokeInviteAction } from "@/app/chapters/actions";
import { CopyLinkButton } from "./copy-button";

export default async function InvitesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireUser();
  const chapter = await prisma.chapter.findUnique({
    where: { slug },
    include: {
      invites: {
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: { select: { email: true, name: true } },
        },
      },
    },
  });
  if (!chapter) notFound();
  const membership = await requireChapterMembership(user.id, chapter.id);
  if (membership.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-xl px-6 py-10">
        <h1 className="text-xl font-semibold">Invites</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Only chapter admins can manage invites.
        </p>
      </div>
    );
  }

  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;

  const createBound = createInviteAction.bind(null, chapter.id);
  const revokeBound = revokeInviteAction.bind(null, chapter.id);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link
        href={`/chapters/${chapter.slug}`}
        className="text-sm text-zinc-500 hover:underline"
      >
        ← Back to {chapter.fraternity} — {chapter.name}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Invite links</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Share these links with brothers. Anyone with the link can create an
        account and join this chapter.
      </p>

      <form
        action={createBound}
        className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4"
      >
        <label className="flex flex-col gap-1 text-sm">
          Role
          <select
            name="role"
            defaultValue="MEMBER"
            className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
          >
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Max uses <span className="text-zinc-500">(optional)</span>
          <input
            name="maxUses"
            type="number"
            min={1}
            max={1000}
            className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Expires in (days)
          <input
            name="expiresInDays"
            type="number"
            min={1}
            max={365}
            defaultValue={30}
            className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
          />
        </label>
        <button
          type="submit"
          className="sm:col-span-3 rounded-full bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 py-2 font-medium"
        >
          + Generate invite link
        </button>
      </form>

      <div className="mt-8 space-y-3">
        {chapter.invites.length === 0 ? (
          <p className="text-sm text-zinc-500">No invite links yet.</p>
        ) : (
          chapter.invites.map((invite) => {
            const url = `${origin}/invite/${invite.token}`;
            const expired =
              invite.expiresAt !== null && invite.expiresAt < new Date();
            const usedUp =
              invite.maxUses !== null && invite.uses >= invite.maxUses;
            const active = !expired && !usedUp;
            return (
              <div
                key={invite.id}
                className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4"
              >
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                        active
                          ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                          : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      {expired
                        ? "Expired"
                        : usedUp
                          ? "Used up"
                          : invite.role}
                    </span>
                    <span className="text-zinc-500 text-xs">
                      {invite.uses}
                      {invite.maxUses ? ` / ${invite.maxUses}` : ""} uses ·{" "}
                      {invite.expiresAt
                        ? `expires ${invite.expiresAt.toLocaleDateString()}`
                        : "no expiry"}
                    </span>
                  </div>
                  <form action={revokeBound}>
                    <input
                      type="hidden"
                      name="inviteId"
                      value={invite.id}
                    />
                    <button
                      type="submit"
                      className="text-sm text-red-600 hover:underline"
                    >
                      Revoke
                    </button>
                  </form>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <code className="flex-1 rounded bg-zinc-100 dark:bg-zinc-900 text-xs p-2 overflow-x-auto">
                    {url}
                  </code>
                  <CopyLinkButton url={url} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
