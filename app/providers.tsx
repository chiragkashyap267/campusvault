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
      {/* No ThemeProvider any more. The site is one light theme; the dark
          palette and its 63 override rules are gone, and ThemeToggle was
          already a stub returning null, so nothing could switch anyway. */}
      <AuthInitializer>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#ffffff",
                color: "#0b1220",
                border: "1px solid #e3eaf3",
                boxShadow: "0 6px 24px rgba(11, 18, 32, 0.10)",
                borderRadius: "12px",
                fontSize: "14px",
                fontFamily: "Inter, sans-serif",
              },
              success: {
                iconTheme: { primary: "#047857", secondary: "#ffffff" },
              },
              error: {
                iconTheme: { primary: "#b91c1c", secondary: "#ffffff" },
              },
            }}
          />
      </AuthInitializer>
    </QueryClientProvider>
  );
}
