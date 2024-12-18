import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPin, setPin, fetchPinCreated, setPinCreated } from "@/lib/utils";

export function usePin() {
  const queryClient = useQueryClient();

  // PIN 조회
  const { data: pin, isLoading: isPinLoading } = useQuery({
    queryKey: ["pin"],
    queryFn: getPin,
  });

  // PIN 생성 여부 조회
  const { data: pinCreated, isLoading: isPinCreatedLoading } = useQuery({
    queryKey: ["pinCreated"],
    queryFn: fetchPinCreated,
  });

  // PIN 설정
  const { mutate: setPinMutation } = useMutation({
    mutationFn: setPin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pin"] });
    },
  });

  // PIN 생성 상태 설정
  const { mutate: setPinCreatedMutation } = useMutation({
    mutationFn: setPinCreated,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pinCreated"] });
    },
  });

  return {
    pin,
    pinCreated,
    isLoading: isPinLoading || isPinCreatedLoading,
    setPin: setPinMutation,
    setPinCreated: setPinCreatedMutation,
  };
}
