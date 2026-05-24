"use client";

import { useAuthStore } from "@/lib/store/authStore";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { ResourceCard, ResourceCardSkeleton } from "@/components/resources/ResourceCard";
import { BookOpen, BookmarkPlus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Resource } from "@/lib/types";
import { getResourceById } from "@/lib/firebase/firestore";

export default function WishlistPage() {
  const { user } = useAuthStore();
  const { data: wishlistItems, isLoading: loadingWishlist } = useWishlist(user?.uid);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);

  useEffect(() => {
    async function fetchResources() {
      if (!wishlistItems?.length) {
        setResources([]);
        return;
      }
      setLoadingResources(true);
      try {
        const promises = wishlistItems.map((item) => getResourceById(item.resourceId));
        const results = await Promise.all(promises);
        setResources(results.filter((r) => r !== null) as Resource[]);
      } finally {
        setLoadingResources(false);
      }
    }
    fetchResources();
  }, [wishlistItems]);

  const isLoading = loadingWishlist || loadingResources;

  if (!user) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <BookmarkPlus className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
          <h1 className="text-2xl font-bold text-white mb-2">Sign in to view your saved resources</h1>
          <Link href="/login" className="btn-primary inline-flex items-center gap-2 mt-4 px-6 py-2 rounded-xl">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container pt-24">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <BookmarkPlus className="w-8 h-8 text-cyan-400" />
            My Wishlist
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Resources you have saved for later.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ResourceCardSkeleton key={i} />
          ))}
        </div>
      ) : resources.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
          {resources.map((resource, i) => (
            <ResourceCard key={resource.id} resource={resource} index={i} />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-12 text-center max-w-lg mx-auto mt-12"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
            <BookOpen className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No saved resources</h3>
          <p className="text-slate-500 text-sm mb-6">
            You haven't saved any resources to your wishlist yet.
          </p>
          <Link
            href="/resources"
            className="inline-flex items-center gap-2 text-cyan-400 text-sm hover:text-cyan-300 transition-colors font-medium btn-ghost px-4 py-2 rounded-xl"
          >
            Explore Resources <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      )}
    </div>
  );
}
