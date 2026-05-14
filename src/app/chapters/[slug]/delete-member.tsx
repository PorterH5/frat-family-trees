"use client";

import { deleteMemberAction } from "@/app/chapters/actions";

export function DeleteMemberButton({
  chapterId,
  memberId,
}: {
  chapterId: string;
  memberId: string;
}) {
  const action = deleteMemberAction.bind(null, chapterId);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Delete this member? Their littles will be re-parented.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="memberId" value={memberId} />
      <button
        type="submit"
        className="text-sm text-red-600 hover:underline"
      >
        Delete
      </button>
    </form>
  );
}
