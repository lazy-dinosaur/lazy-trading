import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPin, setPin, fetchPinCreated, setPinCreated } from "@/lib/utils";
import { decryptAccount } from "@/lib/appStorage";

export const validatePinWithAccounts = async (
  pin: string,
  accounts: Record<string, any>,
): Promise<boolean> => {
  // 계정이 없는 경우
  if (!accounts || Object.keys(accounts).length === 0) {
    return false;
  }

  // 첫 번째 계정만 확인해도 충분함
  const firstAccount = Object.values(accounts)[0];
  const decryptedAccount = await decryptAccount(firstAccount, pin);

  // 복호화 성공 여부로 PIN 유효성 판단
  return decryptedAccount !== null;
};

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
