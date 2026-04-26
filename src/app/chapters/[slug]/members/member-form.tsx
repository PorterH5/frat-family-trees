"use client";

import { useActionState, useState } from "react";
import {
  createMemberAction,
  updateMemberAction,
  type MemberState,
} from "@/app/chapters/actions";

const initial: MemberState = {};

type MemberOption = {
  id: string;
  firstName: string;
  lastName: string | null;
  nickname: string | null;
  pledgeClass: string | null;
};

type ExistingMember = {
  id: string;
  firstName: string;
  lastName: string | null;
  nickname: string | null;
  pledgeClass: string | null;
  bigId: string | null;
  notes: string | null;
};

function memberLabel(m: MemberOption): string {
  const full = [m.firstName, m.lastName].filter(Boolean).join(" ");
  const nick = m.nickname ? ` "${m.nickname}"` : "";
  const pc = m.pledgeClass ? ` · ${m.pledgeClass}` : "";
  return `${full}${nick}${pc}`;
}

export function MemberForm({
  chapterId,
  members,
  mode,
  existing,
}: {
  chapterId: string;
  members: MemberOption[];
  mode: "create" | "edit";
  existing?: ExistingMember;
}) {
  const bound =
    mode === "create"
      ? createMemberAction.bind(null, chapterId)
      : updateMemberAction.bind(null, chapterId);
  const [state, action, pending] = useActionState(bound, initial);

  const [pledgeClass, setPledgeClass] = useState(existing?.pledgeClass ?? "");
  const normalizedPledgeClass = pledgeClass.trim().toLowerCase();

  const bigOptions = members.filter((m) => {
    if (existing && m.id === existing.id) return false;
    if (!normalizedPledgeClass) return true;
    const candidatePc = (m.pledgeClass ?? "").trim().toLowerCase();
    return candidatePc !== normalizedPledgeClass;
  });

  return (
    <form action={action} className="flex flex-col gap-3">
      {existing && (
        <input type="hidden" name="memberId" value={existing.id} />
      )}
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          First name
          <input
            name="firstName"
            required
            defaultValue={existing?.firstName ?? ""}
            className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Last name
          <input
            name="lastName"
            defaultValue={existing?.lastName ?? ""}
            className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Nickname <span className="text-zinc-500">(optional)</span>
        <input
          name="nickname"
          defaultValue={existing?.nickname ?? ""}
          className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Pledge class <span className="text-zinc-500">(e.g. &ldquo;Fall 2023&rdquo;)</span>
        <input
          name="pledgeClass"
          value={pledgeClass}
          onChange={(e) => setPledgeClass(e.target.value)}
          className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Big <span className="text-zinc-500">(optional)</span>
        <select
          name="bigId"
          defaultValue={existing?.bigId ?? ""}
          key={normalizedPledgeClass}
          className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
        >
          <option value="">— No big / founding member —</option>
          {bigOptions.map((m) => (
            <option key={m.id} value={m.id}>
              {memberLabel(m)}
            </option>
          ))}
        </select>
        <span className="text-xs text-zinc-500">
          Members in the same pledge class are hidden — a big must come from a
          different pledge class.
        </span>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Notes <span className="text-zinc-500">(optional)</span>
        <textarea
          name="notes"
          defaultValue={existing?.notes ?? ""}
          rows={3}
          className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
        />
      </label>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 py-2 font-medium disabled:opacity-50"
      >
        {pending
          ? "Saving…"
          : mode === "create"
            ? "Add member"
            : "Save changes"}
      </button>
    </form>
  );
}
