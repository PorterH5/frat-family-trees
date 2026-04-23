import { requireUser } from "@/lib/auth";
import { NewChapterForm } from "./form";

export default async function NewChapterPage() {
  await requireUser();
  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      <h1 className="text-2xl font-semibold">Create a new chapter</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        You&apos;ll be added as the admin. Invite brothers after creation.
      </p>
      <div className="mt-6">
        <NewChapterForm />
      </div>
    </div>
  );
}
