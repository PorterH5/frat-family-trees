import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
        Build your fraternity&apos;s family tree.
      </h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl">
        Track big/little lineage, add your pledge class in bulk, and visualize
        every family line back to its founder. Invite chapter brothers with a
        shareable link so they can fill in their own branches.
      </p>
      <div className="mt-8 flex gap-3">
        {user ? (
          <Link
            href="/dashboard"
            className="rounded-full bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 px-5 py-2 font-medium"
          >
            Go to dashboard
          </Link>
        ) : (
          <>
            <Link
              href="/signup"
              className="rounded-full bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 px-5 py-2 font-medium"
            >
              Get started
            </Link>
            <Link
              href="/signin"
              className="rounded-full border border-zinc-300 dark:border-zinc-700 px-5 py-2 font-medium"
            >
              Sign in
            </Link>
          </>
        )}
      </div>
      <section className="mt-16 grid sm:grid-cols-3 gap-6 text-sm">
        <Feature
          title="Pledge class bulk add"
          body="Paste a list of names and a semester — we'll create everyone at once."
        />
        <Feature
          title="Big/little relationships"
          body="Assign bigs to build lineage. Trees are generated automatically."
        />
        <Feature
          title="Invite your brothers"
          body="Generate a shareable invite link. No email address needed."
        />
      </section>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
      <div className="font-medium">{title}</div>
      <div className="mt-1 text-zinc-600 dark:text-zinc-400">{body}</div>
    </div>
  );
}
