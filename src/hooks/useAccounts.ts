import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type ExchangeType = "bitget" | "binance" | "bybit";

interface Account {
  id: string; // 고유 식별자
  name: string; // 계정 이름
  exchange: ExchangeType; // 거래소 종류
  apiKey: string;
  secretKey: string;
  createdAt: number; // 생성 시간 timestamp
}

interface Accounts {
  [accountId: string]: Account;
}

// 모든 계정 조회
const fetchAccounts = async (): Promise<Accounts> => {
  try {
    const result = await chrome.storage.local.get(["accounts"]);
    return result.accounts || {};
  } catch (error) {
    console.error("Failed to fetch accounts:", error);
    return {};
  }
};

// 계정 추가/수정
const setAccount = async (account: Account): Promise<boolean> => {
  try {
    const currentAccounts = await fetchAccounts();
    const updatedAccounts = {
      ...currentAccounts,
      [account.id]: account,
    };
    await chrome.storage.local.set({ accounts: updatedAccounts });
    return true;
  } catch (error) {
    console.error("Failed to set account:", error);
    return false;
  }
};

// 계정 삭제
const deleteAccount = async (accountId: string): Promise<boolean> => {
  try {
    const currentAccounts = await fetchAccounts();
    delete currentAccounts[accountId];
    await chrome.storage.local.set({ accounts: currentAccounts });
    return true;
  } catch (error) {
    console.error("Failed to delete account:", error);
    return false;
  }
};

// 모든 계정 삭제
const deleteAllAccounts = async (): Promise<boolean> => {
  try {
    await chrome.storage.local.set({ accounts: {} });
    return true;
  } catch (error) {
    console.error("Failed to delete all accounts:", error);
    return false;
  }
};

export function useAccounts() {
  const queryClient = useQueryClient();

  // 모든 계정 조회
  const { data: accounts, isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
  });

  // 특정 계정 조회
  const getAccount = (accountId: string) => {
    return accounts?.[accountId] || null;
  };

  // 계정 추가/수정
  const { mutate: setAccountMutation } = useMutation({
    mutationFn: (account: Omit<Account, "id" | "createdAt">) => {
      const newAccount: Account = {
        ...account,
        id: crypto.randomUUID(), // 새 계정인 경우 ID 생성
        createdAt: Date.now(),
      };
      return setAccount(newAccount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

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
  const { mutate: deleteAllAccountsMutation } = useMutation({
    mutationFn: deleteAllAccounts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  return {
    accounts,
    isLoading,
    getAccount,
    addAccount: setAccountMutation,
    updateAccount: updateAccountMutation,
    deleteAccount: deleteAccountMutation,
    deleteAllAccounts: deleteAllAccountsMutation,
  };
}
