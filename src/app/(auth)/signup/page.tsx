import Link from "next/link";
import { SignUpForm } from "./form";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const { invite } = await searchParams;
  return (
    <div className="mx-auto max-w-md py-16 px-6">
      <h1 className="text-2xl font-semibold mb-6">Create an account</h1>
      <SignUpForm invite={invite} />
      <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
        Already have an account?{" "}
        <Link
          href={`/signin${invite ? `?invite=${encodeURIComponent(invite)}` : ""}`}
          className="underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
