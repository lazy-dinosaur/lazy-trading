import { CacheContext } from "@/contexts/cache/type";
import { useContext } from "react";

// Custom hook to use the cache context
export function useCache() {
  const context = useContext(CacheContext);
  if (context === undefined) {
    throw new Error("useCache must be used within a CacheProvider");
  }
  return context;
}
