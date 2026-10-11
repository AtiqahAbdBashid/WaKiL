// Mock YB office session. Replace with Google OAuth code flow + backend verify later.
/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { ybStaff } from "../data/ybStaff";

const YbAuthContext = createContext(null);

const isExpired = (u) => !!u?.expiresAt && new Date(u.expiresAt) < new Date();

export function YbAuthProvider({ children }) {
  const [userId, setUserId] = useState("u-representative");

  // Session guard mirrors backend has_access: only active, unexpired staff resolve.
  const user = ybStaff.find((s) => s.id === userId && s.active && !isExpired(s)) ?? null;

  const login = useCallback((id) => setUserId(id), []);
  const logout = useCallback(() => setUserId(null), []);
  const mockGoogleLogin = useCallback((id = "u-representative") => setUserId(id), []);

  const value = useMemo(
    () => ({
      user,
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
      mockGoogleLogin,
      switchUser: setUserId,
    }),
    [user, login, logout, mockGoogleLogin]
  );

  return <YbAuthContext.Provider value={value}>{children}</YbAuthContext.Provider>;
}

export function useYbAuth() {
  const ctx = useContext(YbAuthContext);
  if (!ctx) throw new Error("useYbAuth must be used inside YbAuthProvider");
  return ctx;
}
