import { useEffect, useState } from "react";
import { getStoredUser, getToken, subscribeSession } from "@/lib/api/session";
import type { ApiUser } from "@/types/api";

/** Reactive view of the stored JWT session. */
export function useSession() {
  const [state, setState] = useState<{ token: string | null; user: ApiUser | null }>({
    token: null,
    user: null,
  });

  useEffect(() => {
    const read = () => setState({ token: getToken(), user: getStoredUser() });
    read();
    return subscribeSession(read);
  }, []);

  return { ...state, isAuthenticated: Boolean(state.token) };
}