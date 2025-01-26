import { ExchangeType } from "./accounts";
import { decryptKey, encryptKey, EncryptedData } from "./cryptography";

export type TradingConfigType = {
  risk: number;
  riskRatio: number;
  partialClose: boolean;
  closeRatio: number;
  stopToEven: boolean;
};

// 복호화된 계정 타입
export interface DecryptedAccount
  extends Omit<Account, "apiKey" | "secretKey"> {
  apiKey: string;
  secretKey: string;
}

// 암호화되지 않은 계정 입력 타입
export interface RawAccountInput
  extends Omit<Account, "apiKey" | "secretKey" | "id" | "createdAt"> {
  apiKey: string;
  secretKey: string;
}

export interface Account {
  id: string; // 고유 식별자
  name: string; // 계정 이름
  exchange: ExchangeType; // 거래소 종류
  apiKey: EncryptedData;
  secretKey: EncryptedData;
  createdAt: number; // 생성 시간 timestamp
}

export interface Accounts {
  [accountId: string]: Account;
}

export const getisFirstRun = async () => {};

export const setTradingConfig = async (
  setting: TradingConfigType,
): Promise<void> => {
  try {
    await chrome.storage.local.set({ tradingSetting: setting });
  } catch (error) {
    console.error("Failed to set pinCreated in storage:", error);
    throw error;
  }
};

export const getTradingConfig = async (): Promise<TradingConfigType | null> => {
  try {
    const result = await chrome.storage.local.get(["tradingSetting"]);

    return result.tradingSetting ?? null;
  } catch (error) {
    console.error("Failed to get pinCreated from storage:", error);
    throw error; // React Query가 에러를 처리할 수 있도록 throw
  }
};

// 모든 계정 조회
export const fetchAccounts = async (): Promise<Accounts> => {
  try {
    const result = await chrome.storage.local.get(["accounts"]);
    return result.accounts || {};
  } catch (error) {
    console.error("Failed to fetch accounts:", error);
    return {};
  }
};

// 계정 추가/수정
export const setAccount = async (account: Account): Promise<boolean> => {
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
export const deleteAccount = async (accountId: string): Promise<boolean> => {
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
export const deleteAllAccounts = async (): Promise<boolean> => {
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
    const decryptedApiKey = await decryptKey(account.apiKey, pin);
    const decryptedSecretKey = await decryptKey(account.secretKey, pin);

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

export const encryptAccount = async (
  account: RawAccountInput,
  pin: string | null | undefined,
): Promise<Account | null> => {
  if (!pin) {
    console.warn("PIN is not set");
    return null;
  }

  try {
    const encryptedApiKey = await encryptKey(account.apiKey, pin);
    const encryptedSecretKey = await encryptKey(account.secretKey, pin);

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
export const addAccount = async ({
  rawAccount,
  pin,
}: {
  rawAccount: RawAccountInput;
  pin: string | null | undefined;
}) => {
  const encryptedAccount = await encryptAccount(rawAccount, pin);
  if (!encryptedAccount) {
    throw new Error("Failed to encrypt account");
  }
  return setAccount(encryptedAccount);
};
