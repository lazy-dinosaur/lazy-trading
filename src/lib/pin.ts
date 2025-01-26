import { VERIFICATION_STRING } from "@/contexts/pin-context-type";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { encryptKey, EncryptedData, decryptKey } from "./cryptography";

export const usePinCreated = () =>
  useQuery({
    queryKey: ["isPinCreated"],
    queryFn: async () => {
      const result = await chrome.storage.local.get(["encryptedPin"]);
      return !!result.encryptedPin;
    },
  });

export const usePinMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pin: string) => {
      if (!pin) {
        console.warn("PIN is not set");
        return null;
      }
      try {
        const encryptedPin = await encryptKey(VERIFICATION_STRING, pin);
        console.log("Encrypted PIN:", encryptedPin);

        await chrome.storage.local.set({ encryptedPin });
        await chrome.storage.session.set({ pin });

        queryClient.setQueryData(["validPin"], pin);
        queryClient.setQueryData(["isPinCreated"], true);

        return true;
      } catch (error) {
        console.error(`Failed to encryptPin:`, error);
        return null;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["encryptedPin"] });
      queryClient.invalidateQueries({ queryKey: ["isPinCreated"] });
    },
  });
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
        const decryptedPin = await decryptKey(encryptedPin, pin);
        if (decryptedPin === VERIFICATION_STRING) {
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

  const validPinQuery = useQuery({
    queryKey: ["validPin"],
    staleTime: Infinity,
    initialData: undefined,
  });

  return {
    pinValidation,
    validPin: validPinQuery.data,
  };
};
