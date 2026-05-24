"use client";

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import {
  getResources,
  getResourceById,
  getFeaturedResources,
  getRecentResources,
  getTrendingResources,
  getUserResources,
  createResource,
  incrementDownload,
  toggleLike,
  approveResource,
  rejectResource,
  deleteResource,
  getPendingResources,
} from "@/lib/firebase/firestore";
import { Resource, ResourceFilters } from "@/lib/types";

type FirestoreCursor = QueryDocumentSnapshot<DocumentData> | undefined;

export function useResources(filters: ResourceFilters = {}) {
  return useInfiniteQuery<
    { resources: Resource[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null },
    Error,
    { pages: { resources: Resource[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }[] },
    (string | ResourceFilters)[],
    FirestoreCursor
  >({
    queryKey: ["resources", filters],
    queryFn: ({ pageParam }) => getResources(filters, 12, pageParam),
    getNextPageParam: (lastPage) => lastPage.lastDoc ?? undefined,
    initialPageParam: undefined,
    staleTime: 60 * 1000, // Cache results for 1 minute
  });
}

export function useResource(id: string) {
  return useQuery({
    queryKey: ["resource", id],
    queryFn: () => getResourceById(id),
    enabled: !!id,
    staleTime: 30 * 1000, // Cache resource details for 30 seconds
  });
}

export function useFeaturedResources() {
  return useQuery({
    queryKey: ["resources", "featured"],
    queryFn: getFeaturedResources,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecentResources(count = 6) {
  return useQuery({
    queryKey: ["resources", "recent", count],
    queryFn: () => getRecentResources(count),
    staleTime: 2 * 60 * 1000,
  });
}

export function useTrendingResources(count = 6) {
  return useQuery({
    queryKey: ["resources", "trending", count],
    queryFn: () => getTrendingResources(count),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUserResources(uid: string | undefined) {
  return useQuery({
    queryKey: ["resources", "user", uid],
    queryFn: () => getUserResources(uid!),
    enabled: !!uid,
  });
}

export function usePendingResources() {
  return useQuery({
    queryKey: ["resources", "pending"],
    queryFn: getPendingResources,
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Resource, "id" | "createdAt" | "downloads" | "likes" | "likedBy">) =>
      createResource(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
  });
}

export function useDownloadResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => incrementDownload(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["resource", id] });
    },
  });
}

export function useLikeResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ resourceId, uid, liked }: { resourceId: string; uid: string; liked: boolean }) =>
      toggleLike(resourceId, uid, liked),
    onSuccess: (_, { resourceId }) => {
      queryClient.invalidateQueries({ queryKey: ["resource", resourceId] });
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
  });
}

export function useApproveResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveResource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources", "pending"] });
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
  });
}

export function useRejectResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rejectResource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources", "pending"] });
    },
  });
}

export function useDeleteResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteResource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
  });
}
