import {
  fetchPinCreated,
  fetchEncryptedPin,
  checkPinValid,
  setPin,
} from "@/lib/app-storage";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";

export const usePinCreated = () =>
  useQuery({
    queryKey: ["isPinCreated"],
    queryFn: fetchPinCreated,
  });

export const usePinMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setPin,
    onSuccess: (data) => {
      if (data?.success) {
        queryClient.setQueryData(["validPin"], data.pin);
        queryClient.setQueryData(["isPinCreated"], true);
      }
      queryClient.invalidateQueries({ queryKey: ["encryptedPin"] });
      queryClient.invalidateQueries({ queryKey: ["isPinCreated"] });
    },
  });
};

export const useGetPin = () =>
  useQuery({
    queryKey: ["encryptedPin"],
    queryFn: fetchEncryptedPin,
  });

export const usePinValid = () => {
  const queryClient = useQueryClient();

  const pinValidation = useMutation({
    mutationFn: checkPinValid,
    onSuccess: (data) => {
      if (data?.success) {
        queryClient.setQueryData(["validPin"], data.pin);
      }
    },
  });

  const validPinQuery = useQuery<string>({
    queryKey: ["validPin"],
    staleTime: Infinity,
    initialData: undefined,
  });

  return {
    pinValidation,
    validPin: validPinQuery.data,
  };
};
