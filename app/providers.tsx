"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { useAuth } from "@/lib/hooks/useAuth";

function AuthInitializer({ children }: { children: ReactNode }) {
  useAuth(); // Bootstraps Firebase auth listener into Zustand
  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "rgba(10, 15, 30, 0.95)",
              color: "#f1f5f9",
              border: "1px solid rgba(0, 212, 255, 0.2)",
              backdropFilter: "blur(20px)",
              borderRadius: "12px",
              fontSize: "14px",
              fontFamily: "Inter, sans-serif",
            },
            success: {
              iconTheme: { primary: "#10b981", secondary: "#030712" },
            },
            error: {
              iconTheme: { primary: "#ef4444", secondary: "#030712" },
            },
          }}
        />
      </AuthInitializer>
    </QueryClientProvider>
  );
}
