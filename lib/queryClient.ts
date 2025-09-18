import { QueryClient } from "@tanstack/react-query";

/**
 * Centralized React Query client configuration
 * Optimized for mobile app with club-wide data management
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 1 minute - data stays fresh for 1 minute
      gcTime: 300_000, // 5 minutes - cache cleanup after 5 minutes
      retry: 1, // Retry failed requests once
      refetchOnWindowFocus: false, // Don't refetch on window focus for mobile
      refetchOnReconnect: true, // Refetch when network reconnects
    },
    mutations: {
      retry: 0, // Don't retry mutations by default
    },
  },
});
