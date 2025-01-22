import { PinContext, VERIFICATION_STRING } from "./pin-context-type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { encryptApiKey, decryptApiKey, EncryptedData } from "@/lib/apiKey";

const usePinCreated = () =>
  useQuery({
    queryKey: ["isPinCreated"],
    queryFn: async () => {
      const result = await chrome.storage.local.get(["encryptedPin"]);
      return !!result.encryptedPin;
    },
  });

const usePinMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pin: string) => {
      if (!pin) {
        console.warn("PIN is not set");
        return null;
      }
      try {
        const encryptedPin = await encryptApiKey(VERIFICATION_STRING, pin);
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

const useGetPin = () =>
  useQuery({
    queryKey: ["encryptedPin"],
    queryFn: async () => {
      const result = await chrome.storage.local.get(["encryptedPin"]);
      return result.encryptedPin;
    },
  });

const usePinValid = () => {
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

export function PinProvider({ children }: { children: React.ReactNode }) {
  const isPinCreatedQuery = usePinCreated();
  const pinMutation = usePinMutation();
  const getPinQuery = useGetPin();
  const pinValidation = usePinValid();

  return (
    <PinContext.Provider
      value={{
        isPinCreatedQuery,
        pinMutation,
        getPinQuery,
        pinValidation,
      }}
    >
      {children}
    </PinContext.Provider>
  );
}
