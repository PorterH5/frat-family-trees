"use client";

import { useActionState } from "react";
import { signupAction, type AuthState } from "../actions";

const initialState: AuthState = {};

export function SignUpForm({ invite }: { invite?: string }) {
  const [state, formAction, pending] = useActionState(
    signupAction,
    initialState,
  );
  return (
    <form action={formAction} className="flex flex-col gap-3">
      {invite && <input type="hidden" name="invite" value={invite} />}
      <label className="flex flex-col gap-1 text-sm">
        Name <span className="text-zinc-500">(optional)</span>
        <input
          name="name"
          type="text"
          autoComplete="name"
          className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Password
        <input
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
        />
      </label>
      {state.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 py-2 font-medium disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create account"}
      </button>
    </form>
  );
}
