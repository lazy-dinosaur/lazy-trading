import { EncryptedData, encryptApiKey, decryptApiKey } from "@/lib/apiKey";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePin } from "@/hooks/usePin";

// 복호화된 계정 타입
export interface DecryptedAccount
  extends Omit<Account, "apiKey" | "secretKey"> {
  apiKey: string;
  secretKey: string;
}

// 암호화되지 않은 계정 입력 타입
interface RawAccountInput
  extends Omit<Account, "apiKey" | "secretKey" | "id" | "createdAt"> {
  apiKey: string;
  secretKey: string;
}

export type ExchangeType = "bitget" | "binance" | "bybit";

interface Account {
  id: string; // 고유 식별자
  name: string; // 계정 이름
  exchange: ExchangeType; // 거래소 종류
  apiKey: EncryptedData;
  secretKey: EncryptedData;
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

export const decryptAccount = async (
  account: Account,
  pin: string,
): Promise<DecryptedAccount | null> => {
  if (!pin) {
    console.warn("PIN is not set");
    return null;
  }

  try {
    const decryptedApiKey = await decryptApiKey(account.apiKey, pin);
    const decryptedSecretKey = await decryptApiKey(account.secretKey, pin);

    return {
      ...account,
      apiKey: decryptedApiKey,
      secretKey: decryptedSecretKey,
    };
  } catch (error) {
    console.error(`Failed to decrypt account ${account.id}:`, error);
    return null;
  }
};

export function useAccounts() {
  const queryClient = useQueryClient();
  const { pin } = usePin(); // PIN 자동으로 가져오기

  // 단일 계정 복호화

  // 계정 암호화
  const encryptAccount = async (
    account: RawAccountInput,
  ): Promise<Account | null> => {
    if (!pin) {
      console.warn("PIN is not set");
      return null;
    }

    try {
      const encryptedApiKey = await encryptApiKey(account.apiKey, pin);
      const encryptedSecretKey = await encryptApiKey(account.secretKey, pin);

      return {
        ...account,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        apiKey: encryptedApiKey,
        secretKey: encryptedSecretKey,
      };
    } catch (error) {
      console.error("Failed to encrypt account:", error);
      return null;
    }
  };

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
      mutationFn: async (rawAccount: RawAccountInput) => {
        const encryptedAccount = await encryptAccount(rawAccount);
        if (!encryptedAccount) {
          throw new Error("Failed to encrypt account");
        }
        return setAccount(encryptedAccount);
      },
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
