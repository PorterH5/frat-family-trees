"use client";

import { useTransition } from "react";
import { acceptInviteAction } from "@/app/chapters/actions";

export function AcceptInvite({ token }: { token: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => acceptInviteAction(token))}
      className="rounded-full bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 px-5 py-2 font-medium disabled:opacity-50"
    >
      {pending ? "Joining…" : "Accept invite & join chapter"}
    </button>
  );
}
