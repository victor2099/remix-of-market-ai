import { cn } from "@/lib/utils";
import type { ApiUser } from "@/types/api";

export function initialsFor(user: Pick<ApiUser, "first_name" | "last_name" | "email"> | null) {
  if (!user) return "?";
  const first = user.first_name?.trim()?.[0] ?? "";
  const last = user.last_name?.trim()?.[0] ?? "";
  const initials = `${first}${last}`.trim();
  if (initials) return initials.toUpperCase();
  return (user.email?.slice(0, 2) || "?").toUpperCase();
}

/** Profile icon that always shows the user's initials. */
export function UserAvatar({
  user,
  className,
}: {
  user: ApiUser | null;
  className?: string | undefined;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold tracking-wide text-brand-foreground ring-1 ring-brand/30",
        className,
      )}
    >
      {initialsFor(user)}
    </span>
  );
}
