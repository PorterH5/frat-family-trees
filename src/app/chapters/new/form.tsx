"use client";

import { useActionState } from "react";
import {
  createChapterAction,
  type ChapterState,
} from "@/app/chapters/actions";

const initial: ChapterState = {};

export function NewChapterForm() {
  const [state, action, pending] = useActionState(
    createChapterAction,
    initial,
  );
  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Fraternity
        <input
          name="fraternity"
          required
          placeholder="e.g. Sigma Chi"
          className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Chapter designation
        <input
          name="name"
          required
          placeholder="e.g. Alpha Beta"
          className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        School <span className="text-zinc-500">(optional)</span>
        <input
          name="school"
          placeholder="e.g. Purdue University"
          className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
        />
      </label>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 py-2 font-medium disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create chapter"}
      </button>
    </form>
  );
}
