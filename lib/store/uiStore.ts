"use client";

import { create } from "zustand";
import { ResourceFilters } from "@/lib/types";

interface UIState {
  mobileMenuOpen: boolean;
  searchQuery: string;
  filters: ResourceFilters;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  setSearchQuery: (q: string) => void;
  setFilter: (key: keyof ResourceFilters, value: string | number) => void;
  resetFilters: () => void;
}

const defaultFilters: ResourceFilters = {
  search: "",
  type: "",
  branch: "",
  semester: "",
  subject: "",
  sortBy: "recent",
};

export const useUIStore = create<UIState>((set) => ({
  mobileMenuOpen: false,
  searchQuery: "",
  filters: defaultFilters,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  toggleMobileMenu: () =>
    set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),
  resetFilters: () => set({ filters: defaultFilters }),
}));
