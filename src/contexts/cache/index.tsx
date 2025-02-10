import React, { useCallback } from "react";
import { AppState } from "@/lib/app-cache";
import { CacheContext } from "./type";
import { useCacheMutation, useCacheQuery } from "@/hooks/use-cache";

export function CacheProvider({ children }: { children: React.ReactNode }) {
  // Fetch cache data
  const { data: cache, isLoading, error } = useCacheQuery();

  // Update cache mutation
  const { mutateAsync: updateCacheMutation } = useCacheMutation();

  // Update cache wrapper function
  const updateCache = useCallback(
    async (newState: Partial<AppState>) => {
      await updateCacheMutation(newState);
    },
    [updateCacheMutation],
  );

  return (
    <CacheContext.Provider
      value={{
        cache,
        isLoading,
        error,
        updateCache,
      }}
    >
      {children}
    </CacheContext.Provider>
  );
}
