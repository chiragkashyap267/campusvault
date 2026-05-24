"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  isInWishlist,
} from "@/lib/firebase/firestore";

export function useWishlist(uid: string | undefined) {
  return useQuery({
    queryKey: ["wishlist", uid],
    queryFn: () => getWishlist(uid!),
    enabled: !!uid,
    staleTime: 60 * 1000,
  });
}

export function useIsInWishlist(uid: string | undefined, resourceId: string) {
  return useQuery({
    queryKey: ["wishlist", uid, resourceId],
    queryFn: () => isInWishlist(uid!, resourceId),
    enabled: !!uid && !!resourceId,
    staleTime: 60 * 1000,
  });
}

export function useToggleWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      uid,
      resourceId,
      inWishlist,
    }: {
      uid: string;
      resourceId: string;
      inWishlist: boolean;
    }) => {
      if (inWishlist) {
        await removeFromWishlist(uid, resourceId);
      } else {
        await addToWishlist(uid, resourceId);
      }
    },
    onSuccess: (_, { uid, resourceId }) => {
      queryClient.invalidateQueries({ queryKey: ["wishlist", uid] });
      queryClient.invalidateQueries({ queryKey: ["wishlist", uid, resourceId] });
    },
  });
}
