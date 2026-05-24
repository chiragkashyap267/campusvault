"use client";

import { useEffect } from "react";
import { onAuthStateChange } from "@/lib/firebase/auth";
import { getUserProfile, isAdmin as checkIsAdmin } from "@/lib/firebase/firestore";
import { useAuthStore } from "@/lib/store/authStore";
import { User } from "@/lib/types";

export function useAuth() {
  const { user, loading, isAdmin, setUser, setLoading, setIsAdmin, clearUser } =
    useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        const adminStatus = await checkIsAdmin(firebaseUser.uid);
        const userData: User = profile || {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
        };
        setUser(userData);
        setIsAdmin(adminStatus);
      } else {
        clearUser();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading, setIsAdmin, clearUser]);

  return { user, loading, isAdmin };
}
