import { getAppState, updateAppState } from "@/lib/appState";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePinValid } from "./pin";
import { useEffect } from "react";

export const APP_STATE_KEY = ["appState"];

// 백그라운드와 통신하는 함수들
export interface AppState {
  currentRoute: string | null;
  data: Record<string, any>;
}

export const useFetchCache = () => {
  const { validPin } = usePinValid();
  useEffect(() => {
    console.log(validPin);
  }, [validPin]);

  return useQuery({
    queryKey: APP_STATE_KEY,
    queryFn: getAppState,
    enabled: !!validPin,
    staleTime: Infinity,
  });
};

export const useUpdateCache = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAppState,
    onSuccess: (newState) => {
      queryClient.setQueryData(APP_STATE_KEY, newState);
    },
  });
};
