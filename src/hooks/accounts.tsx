import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { usePin } from "@/contexts/pin/use";
import toast from "react-hot-toast"; // toast import 추가
import {
  Account, // 중복 제거
  addAccount, // 중복 제거
  BalanceMutationParams, // 중복 제거
  decrypteAllAccounts, // 중복 제거
  fetchAccounts,
  fetchBalance,
  isAccountValid,
  RawAccountInput,
  setAccount,
} from "@/lib/accounts";

export const useFetchAccount = () =>
  useQuery({
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
    refetchInterval: 200,
  });

export const useAllDecryptedAccounts = () => {
  const { validPin } = usePin();
  const { data: accounts, isLoading } = useFetchAccount();
  return useQuery({
    queryKey: ["decryptedAccounts", validPin],
    queryFn: async () =>
      validPin && accounts ? await decrypteAllAccounts(validPin, accounts) : {},
    enabled: !!validPin && !isLoading && !!accounts,
    refetchInterval: 200,
  });
};

export const useAccountsBalance = () => {
  const { data, isLoading: isDecrypting } = useAllDecryptedAccounts();
  return useQuery({
    queryKey: ["accountsDetails"],
    queryFn: async () => await fetchBalance(data),
    enabled: !!data && !isDecrypting,
    refetchInterval: 1500,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchIntervalInBackground: true,
  });
};

export const useAddAccount = () => {
  const queryClient = useQueryClient();
  const { validPin } = usePin();
  return useMutation({
    mutationKey: ["addaccount"],
    mutationFn: async (rawAccount: RawAccountInput) =>
      await addAccount({ rawAccount, pin: validPin }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["accountsDetail"] });
      queryClient.invalidateQueries({ queryKey: ["decryptedAccounts"] });
    },
  });
};

// 계정 포지션 모드 업데이트 훅 추가
export const useUpdateAccountPositionMode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      accountId,
      positionMode,
    }: {
      accountId: string;
      positionMode: "oneway" | "hedge";
    }) => {
      const currentAccounts = await fetchAccounts();
      const accountToUpdate = currentAccounts[accountId];

      if (!accountToUpdate) {
        throw new Error(`Account with ID ${accountId} not found.`);
      }

      // positionMode 업데이트
      const updatedAccount: Account = {
        ...accountToUpdate,
        positionMode: positionMode,
      };

      // 업데이트된 계정 정보 저장
      const success = await setAccount(updatedAccount);
      if (!success) {
        throw new Error("Failed to save updated account.");
      }
      return updatedAccount;
    },
    onSuccess: () => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["decryptedAccounts"] });
      // 필요하다면 accountsDetails 등 다른 관련 쿼리도 무효화
    },
    onError: (error) => {
      console.error("Failed to update position mode:", error);
      toast.error(`포지션 모드 업데이트 실패: ${error.message}`);
    },
  });
};

export const useIsAccountValid = () => {
  return useMutation({
    mutationFn: async ({ exchange, apikey, secret }: BalanceMutationParams) => {
      return isAccountValid({ exchange, apikey, secret });
    },
  });
};
