"use client";

import { useActionState } from "react";
import {
  bulkAddPledgeClassAction,
  type BulkState,
} from "@/app/chapters/actions";

const initial: BulkState = {};

export function BulkAddForm({ chapterId }: { chapterId: string }) {
  const bound = bulkAddPledgeClassAction.bind(null, chapterId);
  const [state, action, pending] = useActionState(bound, initial);
  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Pledge class label
        <input
          name="pledgeClass"
          required
          placeholder="e.g. Fall 2023"
          className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Names (one per line)
        <textarea
          name="names"
          required
          rows={10}
          className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 font-mono text-sm"
        />
      </label>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 py-2 font-medium disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add pledge class"}
      </button>
    </form>
  );
}
