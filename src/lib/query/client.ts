import { QueryClient } from "@tanstack/react-query";

let client: QueryClient | null = null;

export function getQueryClient(): QueryClient {
  if (typeof window === "undefined") {
    // Fresh client per server render (nothing is fetched on the server anyway).
    return new QueryClient();
  }
  client ??= new QueryClient({
    defaultOptions: {
      queries: {
        // Data lives locally; it only changes through our own mutations.
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
  return client;
}
