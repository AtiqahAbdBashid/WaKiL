// YB staff session. The signed token lives in sessionStorage (see ybApi); the
// user is loaded from /api/me. Login is email-only until OAuth lands.
/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ybApi } from "../lib/ybApi";

const YbAuthContext = createContext(null);

export function YbAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(ybApi.hasToken());

  useEffect(() => {
    if (!ybApi.hasToken()) return;
    let live = true;
    ybApi
      .me()
      .then((u) => live && setUser(u))
      .catch(() => ybApi.logout())
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, []);

  const login = useCallback(async (email) => {
    const u = await ybApi.googleLogin(email);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    ybApi.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      userId: user?.id ?? null,
      role: user?.role ?? null,
      isRepresentative: user?.role === "Representative",
      isStaffManager: user?.role === "Representative",
      canViewStaff: user?.role === "Representative",
      canReassign: user?.role === "Representative" || user?.role === "Aide",
      // Representative assigns via reassign dropdown (incl self), no pool self-claim
      canClaim: user?.role === "Aide" || user?.role === "Intern",
      // Interns group only: cannot mark Resolved
      canMarkResolved: user?.role === "Representative",
      login,
      logout,
    }),
    [user, loading, login, logout]
  );

  return <YbAuthContext.Provider value={value}>{children}</YbAuthContext.Provider>;
}

export function useYbAuth() {
  const ctx = useContext(YbAuthContext);
  if (!ctx) throw new Error("useYbAuth must be used inside YbAuthProvider");
  return ctx;
}
