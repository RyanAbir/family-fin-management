"use client";

import { useAuth } from "@/context/AuthContext";

export function useRole() {
  const { profile, loading } = useAuth();
  
  const isSuperAdmin = profile?.role === "super_admin";
  const isAdmin = profile?.role === "admin" || isSuperAdmin;
  const isMember = profile?.role === "member" || isAdmin;
  const isViewer = profile?.role === "viewer";

  return {
    role: profile?.role || "viewer",
    isSuperAdmin,
    isMember,
    isAdmin,
    isViewer,
    loading
  };
}
