import React, { useCallback } from "react";
import { AppState, getAppState, updateAppState } from "@/lib/app-cache";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePin } from "@/hooks/use-pin-context";
import { CacheContext } from "./cache-context-type";

export function CacheProvider({ children }: { children: React.ReactNode }) {
  const { validPin } = usePin();
  const queryClient = useQueryClient();

  // Fetch cache data
  const {
    data: cache,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["cache"],
    queryFn: getAppState,
    enabled: !!validPin,
    staleTime: Infinity,
  });

  // Update cache mutation
  const { mutateAsync: updateCacheMutation } = useMutation({
    mutationFn: updateAppState,
    onSuccess: (newState) => {
      queryClient.setQueryData(["cache"], newState);
    },
  });

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
