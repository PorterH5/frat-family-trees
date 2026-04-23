import Link from "next/link";
import { SignInForm } from "./form";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const { invite } = await searchParams;
  return (
    <div className="mx-auto max-w-md py-16 px-6">
      <h1 className="text-2xl font-semibold mb-6">Sign in</h1>
      <SignInForm invite={invite} />
      <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
        Don&apos;t have an account?{" "}
        <Link
          href={`/signup${invite ? `?invite=${encodeURIComponent(invite)}` : ""}`}
          className="underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
