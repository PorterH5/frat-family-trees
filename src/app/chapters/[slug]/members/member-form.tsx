"use client";

import { useActionState, useMemo, useState } from "react";
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
  bigId?: string | null;
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

/**
 * Walk up the bigId chain starting from `startId` and return the set of
 * ancestor member IDs (not including `startId`).
 */
function ancestorsOf(
  startId: string,
  byId: Map<string, MemberOption>,
): Set<string> {
  const seen = new Set<string>();
  let cursor: string | null | undefined = byId.get(startId)?.bigId ?? null;
  while (cursor && !seen.has(cursor)) {
    seen.add(cursor);
    cursor = byId.get(cursor)?.bigId ?? null;
  }
  return seen;
}

export function MemberForm({
  chapterId,
  members,
  pledgeClasses,
  chapterSlug,
  mode,
  existing,
}: {
  chapterId: string;
  members: MemberOption[];
  pledgeClasses: string[];
  chapterSlug: string;
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

  const byId = useMemo(() => {
    const m = new Map<string, MemberOption>();
    for (const x of members) m.set(x.id, x);
    return m;
  }, [members]);

  const existingLittleIds = useMemo(() => {
    if (!existing) return new Set<string>();
    const s = new Set<string>();
    for (const m of members) if (m.bigId === existing.id) s.add(m.id);
    return s;
  }, [members, existing]);

  const [selectedLittles, setSelectedLittles] = useState<Set<string>>(
    () => new Set(existingLittleIds),
  );

  const toggleLittle = (id: string) => {
    setSelectedLittles((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bigOptions = members.filter((m) => {
    if (existing && m.id === existing.id) return false;
    if (!normalizedPledgeClass) return true;
    const candidatePc = (m.pledgeClass ?? "").trim().toLowerCase();
    return candidatePc !== normalizedPledgeClass;
  });

  // Candidates eligible to be a *little* of `existing`. Excludes self,
  // members in the same pledge class, and members in the current member's
  // ancestor chain (which would form a cycle if they became a little).
  const ancestorIds = useMemo(() => {
    if (!existing) return new Set<string>();
    return ancestorsOf(existing.id, byId);
  }, [existing, byId]);

  const littleCandidates = existing
    ? members.filter((m) => {
        if (m.id === existing.id) return false;
        if (ancestorIds.has(m.id)) return false;
        if (!normalizedPledgeClass) return true;
        const candidatePc = (m.pledgeClass ?? "").trim().toLowerCase();
        return candidatePc !== normalizedPledgeClass;
      })
    : [];

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
        Pledge class
        {pledgeClasses.length === 0 ? (
          <>
            <input
              name="pledgeClass"
              value={pledgeClass}
              onChange={(e) => setPledgeClass(e.target.value)}
              placeholder="e.g. Fall 2023"
              className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
            />
            <span className="text-xs text-zinc-500">
              No pledge classes yet. Typing one here will create it.
            </span>
          </>
        ) : (
          <>
            <select
              name="pledgeClass"
              value={pledgeClass}
              onChange={(e) => setPledgeClass(e.target.value)}
              className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
            >
              <option value="">— No pledge class —</option>
              {pledgeClasses.map((pc) => (
                <option key={pc} value={pc}>
                  {pc}
                </option>
              ))}
              {/* If the existing member's class isn't in the current list
                  (e.g. stale trim difference), include it so save doesn't wipe. */}
              {existing?.pledgeClass &&
                !pledgeClasses.includes(existing.pledgeClass) && (
                  <option value={existing.pledgeClass}>
                    {existing.pledgeClass}
                  </option>
                )}
            </select>
            <span className="text-xs text-zinc-500">
              To create a new pledge class, use{" "}
              <a
                href={`/chapters/${chapterSlug}/members/bulk`}
                className="underline hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                Bulk add pledge class
              </a>
              .
            </span>
          </>
        )}
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

      {existing && (
        <fieldset className="flex flex-col gap-2 rounded border border-zinc-200 dark:border-zinc-800 p-3">
          <legend className="px-1 text-sm font-medium">Littles</legend>
          {littleCandidates.length === 0 ? (
            <p className="text-xs text-zinc-500">
              {pledgeClass.trim()
                ? `No eligible candidates outside the "${pledgeClass.trim()}" pledge class yet.`
                : "Add a pledge class above to filter candidates."}
            </p>
          ) : (
            <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-1">
              {littleCandidates.map((m) => {
                const checked = selectedLittles.has(m.id);
                const currentBig = m.bigId;
                const stolenFromOther =
                  checked &&
                  currentBig &&
                  currentBig !== existing.id &&
                  !existingLittleIds.has(m.id);
                return (
                  <label
                    key={m.id}
                    className="flex items-start gap-2 text-sm cursor-pointer rounded px-2 py-1 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  >
                    <input
                      type="checkbox"
                      name="littleIds"
                      value={m.id}
                      checked={checked}
                      onChange={() => toggleLittle(m.id)}
                      className="mt-1"
                    />
                    <span className="flex flex-col">
                      <span>{memberLabel(m)}</span>
                      {currentBig &&
                        currentBig !== existing.id &&
                        !checked && (
                          <span className="text-xs text-zinc-500">
                            currently has another big
                          </span>
                        )}
                      {stolenFromOther && (
                        <span className="text-xs text-amber-600">
                          will be reassigned from their current big
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
          <span className="text-xs text-zinc-500">
            Checking someone here makes them this member&rsquo;s little (sets
            their big). Unchecking an existing little clears their big.
          </span>
        </fieldset>
      )}

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
