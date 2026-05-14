import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AcceptInvite } from "./accept";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { chapter: true },
  });
  const user = await getCurrentUser();

  if (!invite) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="text-2xl font-semibold">Invite not found</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          This invite link is invalid or has been revoked.
        </p>
      </div>
    );
  }
  const expired = invite.expiresAt !== null && invite.expiresAt < new Date();
  const usedUp = invite.maxUses !== null && invite.uses >= invite.maxUses;

  if (expired || usedUp) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="text-2xl font-semibold">
          This invite is no longer valid
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          {expired
            ? "The invite has expired."
            : "The invite has been used up."}{" "}
          Ask a chapter admin for a new one.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-16 text-center">
      <div className="text-xs uppercase tracking-wide text-zinc-500">
        You&apos;ve been invited to
      </div>
      <h1 className="text-3xl font-semibold mt-1">
        {invite.chapter.fraternity} — {invite.chapter.name}
      </h1>
      {invite.chapter.school && (
        <div className="text-sm text-zinc-500 mt-1">
          {invite.chapter.school}
        </div>
      )}
      <p className="mt-6 text-zinc-600 dark:text-zinc-400">
        Join this chapter to contribute to their family tree, add pledge class
        brothers, and assign bigs/littles.
      </p>
      <div className="mt-8">
        {user ? (
          <AcceptInvite token={token} />
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/signup?invite=${encodeURIComponent(token)}`}
              className="rounded-full bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 px-5 py-2 font-medium"
            >
              Create account & join
            </Link>
            <Link
              href={`/signin?invite=${encodeURIComponent(token)}`}
              className="rounded-full border border-zinc-300 dark:border-zinc-700 px-5 py-2 font-medium"
            >
              Sign in & join
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
