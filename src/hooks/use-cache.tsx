import { usePin } from "@/contexts/pin/use";
import { getAppState, updateAppState } from "@/lib/app-cache";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useCacheQuery = () => {
  const { validPin } = usePin();
  return useQuery({
    queryKey: ["cache"],
    queryFn: getAppState,
    enabled: !!validPin,
    staleTime: Infinity,
  });
};
export const useCacheMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAppState,
    onSuccess: (newState) => {
      queryClient.setQueryData(["cache"], newState);
    },
  });
};
