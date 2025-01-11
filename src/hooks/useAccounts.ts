import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePin } from "@/hooks/usePin";
import {
  DecryptedAccount,
  RawAccountInput,
  fetchAccounts,
  setAccount,
  deleteAccount,
  deleteAllAccounts,
  decryptAccount,
  Account,
  addAccount,
} from "@/lib/appStorage";

export type ExchangeType = "bitget" | "binance" | "bybit";

export function useAccounts() {
  const queryClient = useQueryClient();
  const { pin } = usePin(); // PIN 자동으로 가져오기

  // 단일 계정 복호화

  // 계정 암호화

  // 모든 계정 조회
  const { data: accounts, isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
  });

  // 암호화된 계정 조회
  const getAccount = (accountId: string) => {
    return accounts?.[accountId] || null;
  };

  // 복호화된 단일 계정 조회 (React Query 적용)
  const useDecryptedAccount = (accountId: string) => {
    return useQuery({
      queryKey: ["decryptedAccount", accountId, pin],
      queryFn: async () => {
        const account = accounts?.[accountId];
        if (!account) return null;
        return await decryptAccount(account, pin as string);
      },
      enabled: !!accounts && !!accountId && !!pin,
    });
  };

  // 모든 복호화된 계정 조회 (React Query 적용)
  const useAllDecryptedAccounts = () => {
    return useQuery({
      queryKey: ["decryptedAccounts", pin],
      queryFn: async () => {
        if (!accounts) return {};

        const decrypted: { [key: string]: DecryptedAccount } = {};
        for (const [id, account] of Object.entries(accounts)) {
          const decryptedAccount = await decryptAccount(account, pin as string);
          if (decryptedAccount) {
            decrypted[id] = decryptedAccount;
          }
        }
        return decrypted;
      },
      enabled: !!accounts && !!pin,
    });
  };

  // 계정 추가
  const { mutate: setAccountMutation, isSuccess: isAccountAdded } = useMutation(
    {
      mutationFn: async (rawAccount: RawAccountInput) =>
        await addAccount({ rawAccount, pin }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["accounts"] });
      },
    },
  );

  // 계정 수정
  const { mutate: updateAccountMutation } = useMutation({
    mutationFn: (account: Account) => setAccount(account),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  // 계정 삭제
  const { mutate: deleteAccountMutation } = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  // 모든 계정 삭제
  const { mutate: deleteAllAccountsMutation, isSuccess: isAllAccountsDeleted } =
    useMutation({
      mutationFn: deleteAllAccounts,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["accounts"] });
      },
    });

  return {
    accounts,
    isLoading,
    getAccount,
    useDecryptedAccount,
    useAllDecryptedAccounts,
    addAccount: setAccountMutation,
    isAccountAdded,
    updateAccount: updateAccountMutation,
    deleteAccount: deleteAccountMutation,
    deleteAllAccounts: deleteAllAccountsMutation,
    isAllAccountsDeleted,
  };
}
