"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/lib/types";

interface AuthState {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: true,
      isAdmin: false,
      setUser: (user) => set({ user }),
      setLoading: (loading) => set({ loading }),
      setIsAdmin: (isAdmin) => set({ isAdmin }),
      clearUser: () => set({ user: null, isAdmin: false }),
    }),
    {
      name: "campusvault-auth",
      partialize: (state) => ({ user: state.user, isAdmin: state.isAdmin }),
    }
  )
);
