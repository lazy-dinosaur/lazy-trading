import { decryptApiKey, encryptApiKey, EncryptedData } from "@/lib/apiKey";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
const VERIFICATION_STRING = "PIN_VERIFICATION_TOKEN";

export const usePinCreated = () =>
  useQuery({
    queryKey: ["isPinCreated"],
    queryFn: async () => {
      const result = await chrome.storage.local.get(["encryptedPin"]);
      return !!result.encryptedPin;
    },
  });

// PIN 설정
export const usePinMutation = () => {
  const queryClient = useQueryClient();

  const pinMutation = useMutation({
    mutationFn: async (pin: string) => {
      if (!pin) {
        console.warn("PIN is not set");
        return null;
      }
      try {
        const encryptedPin = await encryptApiKey(VERIFICATION_STRING, pin);
        console.log("Encrypted PIN:", encryptedPin);

        // 로컬 스토리지에 저장
        await chrome.storage.local.set({ encryptedPin });
        await chrome.storage.session.set({ pin });

        // 전역 상태 업데이트
        queryClient.setQueryData(["validPin"], pin);
        queryClient.setQueryData(["isPinCreated"], true);

        return true;
      } catch (error) {
        console.error(`Failed to encryptPin:`, error);
        return null;
      }
    },
    onSuccess: () => {
      // PIN이 생성/변경되면 관련 쿼리들 무효화
      queryClient.invalidateQueries({ queryKey: ["encryptedPin"] });
      queryClient.invalidateQueries({ queryKey: ["isPinCreated"] });
    },
  });

  return pinMutation;
};

export const useGetPin = () =>
  useQuery({
    queryKey: ["encryptedPin"],
    queryFn: async () => {
      const result = await chrome.storage.local.get(["encryptedPin"]);
      return result.encryptedPin;
    },
  });

export const usePinValid = () => {
  const queryClient = useQueryClient();

  const pinValidation = useMutation({
    mutationFn: async ({
      encryptedPin,
      pin,
    }: {
      encryptedPin: EncryptedData;
      pin: string;
    }) => {
      if (!pin) {
        console.warn("PIN is not set");
        return null;
      }
      try {
        const decryptedPin = await decryptApiKey(encryptedPin, pin);
        if (decryptedPin === VERIFICATION_STRING) {
          // PIN이 유효하면 전역 상태로 저장
          queryClient.setQueryData(["validPin"], pin);
          return true;
        }
        return false;
      } catch (error) {
        console.error("Failed to decrypt PIN:", error);
        return null;
      }
    },
  });

  // validPin 쿼리 설정
  const { data: validPin } = useQuery({
    queryKey: ["validPin"],
    staleTime: Infinity,
    // 초기값은 undefined
    initialData: undefined,
  });

  return {
    pinValidation,
    validPin,
  };
};
