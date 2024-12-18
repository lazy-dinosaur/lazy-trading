import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getStarted, setStarted } from "@/lib/utils";

export function useStartup() {
  const queryClient = useQueryClient();

  // PIN 조회
  const { data: isStarted, isLoading: isStartedLoading } = useQuery({
    queryKey: ["started"],
    queryFn: getStarted,
  });

  // PIN 설정
  const { mutate: setStartedMutation } = useMutation({
    mutationFn: setStarted,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["started"] });
    },
  });

  return {
    isStarted,
    isLoading: isStartedLoading,
    setStarted: setStartedMutation,
  };
}
