import { EncryptedData, decryptKey, encryptKey } from "./cryptography";
import ccxt, { Balances, binance, bitget, bybit, Exchange } from "ccxt";

export interface BalanceMutationParams {
  exchange: ExchangeType;
  apikey: string;
  secret: string;
}

// 복호화된 계정 타입
export interface DecryptedAccount
  extends Omit<Account, "apiKey" | "secretKey"> {
  apiKey: string;
  secretKey: string;
  positionMode?: "oneway" | "hedge"; // 포지션 모드 추가
  exchangeInstance: {
    ccxt: bitget | binance | bybit;
    pro: bitget | binance | bybit;
  };
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
  positionMode?: "oneway" | "hedge"; // 포지션 모드 추가
  createdAt: number; // 생성 시간 timestamp
}

export interface Accounts {
  [accountId: string]: Account;
}

export interface USDBalance {
  total: number;
  used: number;
  free: number;
}

interface CoinInfo {
  availableToBorrow?: string;
  bonus?: string;
  accruedInterest?: string;
  availableToWithdraw?: string;
  totalOrderIM?: string;
  equity?: string;
  totalPositionMM?: string;
  usdValue?: string;
  unrealisedPnl?: string;
  collateralSwitch?: boolean;
  spotHedgingQty?: string;
  borrowAmount?: string;
  totalPositionIM?: string;
  walletBalance?: string;
  cumRealisedPnl?: string;
  locked?: string;
  marginCollateral?: boolean;
  coin?: string;
}

interface BalanceInfo {
  totalEquity?: string;
  accountIMRate?: string;
  totalMarginBalance?: string;
  totalInitialMargin?: string;
  accountType?: string;
  totalAvailableBalance?: string;
  accountMMRate?: string;
  totalPerpUPL?: string;
  totalWalletBalance?: string;
  accountLTV?: string;
  totalMaintenanceMargin?: string;
  coin?: CoinInfo[];
}

interface BalanceResult {
  list?: BalanceInfo[];
}

interface BalanceResponse {
  retCode?: string;
  retMsg?: string;
  result?: BalanceResult;
  retExtInfo?: any;
  time?: string;
}

export type BalancesType = {
  info: BalanceResponse;
  timestamp: number;
  datetime: string;
  [currency: string]:
    | {
        free: number;
        used: number;
        total: number;
        debt: number;
      }
    | any;
  free: { [currency: string]: number };
  used: { [currency: string]: number };
  total: { [currency: string]: number };
  debt: { [currency: string]: number };
  usd: USDBalance;
};

export type AccountBalanceInfo = {
  account: DecryptedAccount;
  balance: BalancesType;
};

export type AccountBalanceInfoType = {
  [keyof: string]: AccountBalanceInfo;
};

export type ExchangeType = "bitget" | "binance" | "bybit";
export type DecryptedAccountObj = { [key: string]: DecryptedAccount };

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
    const exchangeInstance = await createAccountInstance(
      account.exchange,
      decryptedApiKey,
      decryptedSecretKey,
    );

    return {
      ...account,
      apiKey: decryptedApiKey,
      secretKey: decryptedSecretKey,
      positionMode: account.positionMode || "oneway", // positionMode 포함 (기본값 'oneway')
      exchangeInstance,
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
      positionMode: account.positionMode || "oneway", // positionMode 포함 (기본값 'oneway')
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
  const success = await setAccount(encryptedAccount);
  if (success) {
    // 성공 시 계정 ID 포함하여 반환
    return {
      success: true,
      id: encryptedAccount.id,
    };
  }
  return { success: false };
};

export const decrypteAllAccounts = async (
  validPin: string,
  accounts: Accounts,
) => {
  if (!accounts || !validPin) return {};

  const decrypted: { [key: string]: DecryptedAccount } = {};
  for (const [id, account] of Object.entries(accounts)) {
    const decryptedAccount = await decryptAccount(account, validPin);
    if (decryptedAccount) {
      decrypted[id] = decryptedAccount;
    }
  }
  return decrypted;
};

async function handleBybitBalance(balance: Balances): Promise<USDBalance> {
  const usdBalance: USDBalance = { total: 0, used: 0, free: 0 };

  if (balance.info?.result?.list?.[0]?.coin) {
    const coins = balance.info.result.list[0].coin;
    coins.forEach((coin: any) => {
      if (coin.usdValue) {
        const value = parseFloat(coin.usdValue);
        usdBalance.total += value;
        if (coin.equity) {
          usdBalance.free += parseFloat(coin.equity);
        }
        if (coin.locked) {
          usdBalance.used += parseFloat(coin.locked);
        }
      }
    });
  }

  return usdBalance;
}

async function handleBinanceBalance(
  exchange: Exchange,
  balance: Balances,
): Promise<USDBalance> {
  const usdBalance: USDBalance = { total: 0, used: 0, free: 0 };
  const stableCoins = ["USDT", "USDC", "FDUSD", "USD", "BUSD"];

  if (balance.info?.assets) {
    for (const asset of balance.info.assets) {
      const currency = asset.asset;

      if (stableCoins.includes(currency)) {
        usdBalance.free += Number(asset.availableBalance);
        usdBalance.total += Number(asset.walletBalance);
        continue;
      }

      try {
        const symbol = `${currency}/USDT`;
        const ticker = await exchange.fetchTicker(symbol);
        const price = ticker.last || 0;

        usdBalance.free += Number(asset.availableBalance) * price;
        usdBalance.total += Number(asset.walletBalance) * price;
      } catch (error) {
        console.warn(`Failed to calculate USD value for ${currency}:`, error);
      }
    }
  }

  return usdBalance;
}

async function handleBitgetBalance(balance: Balances): Promise<USDBalance> {
  const usdBalance: USDBalance = { total: 0, used: 0, free: 0 };

  if (balance.info?.[0]) {
    const account = balance.info[0];
    if (account.usdtEquity) {
      const value = parseFloat(account.usdtEquity);
      usdBalance.total = value;
      usdBalance.free = value;
    }
    if (account.locked) {
      usdBalance.used = parseFloat(account.locked);
    }
  }

  return usdBalance;
}

async function handleDefaultBalance(
  exchange: Exchange,
  balance: Balances,
): Promise<USDBalance> {
  const usdBalance: USDBalance = { total: 0, used: 0, free: 0 };
  const stableCoins = ["USDT", "USDC", "USD", "BUSD"];

  const assets = Object.entries(balance).filter(([key, value]) => {
    if (
      ["info", "timestamp", "datetime", "free", "used", "total"].includes(key)
    ) {
      return false;
    }
    return (
      value &&
      typeof value === "object" &&
      ("free" in value || "used" in value || "total" in value) &&
      ((value.free ?? 0) > 0 || (value.used ?? 0) > 0)
    );
  });

  for (const [currency, value] of assets) {
    try {
      if (stableCoins.includes(currency)) {
        usdBalance.free += value.free || 0;
        usdBalance.used += value.used || 0;
        usdBalance.total += value.total || 0;
        continue;
      }

      const symbol = `${currency}/USDT`;
      const ticker = await exchange.fetchTicker(symbol);
      const price = ticker.last || 0;

      usdBalance.free += (value.free || 0) * price;
      usdBalance.used += (value.used || 0) * price;
      usdBalance.total += (value.total || 0) * price;
    } catch (error) {
      console.warn(`Failed to calculate USD value for ${currency}:`, error);
    }
  }

  return usdBalance;
}

export async function calculateUSDBalance(
  exchange: Exchange,
  balance: Balances,
): Promise<USDBalance> {
  try {
    let result;

    switch (exchange.id) {
      case "bybit":
        result = await handleBybitBalance(balance);
        break;
      case "binance":
        result = await handleBinanceBalance(exchange, balance);
        break;
      case "bitget":
        result = await handleBitgetBalance(balance);
        break;
      default:
        result = await handleDefaultBalance(exchange, balance);
    }

    return {
      total: Math.round(result.total * 100) / 100,
      used: Math.round(result.used * 100) / 100,
      free: Math.round(result.free * 100) / 100,
    };
  } catch (error) {
    console.error("Error calculating USD balance:", error);
    return { total: 0, used: 0, free: 0 };
  }
}

export const fetchBalance = async (data?: DecryptedAccountObj) => {
  if (!data) throw new Error("Accounts or exchange data not available");

  const accountsInfo: AccountBalanceInfoType = {};

  const accounts = Object.values(data);

  await Promise.all(
    accounts.map(async (account) => {
      try {
        const exchangeInstance = account.exchangeInstance.ccxt;

        const rawBalance = await exchangeInstance.fetchBalance();

        const usdBalance = await calculateUSDBalance(
          exchangeInstance,
          rawBalance,
        );
        console.log("rawBalance:", rawBalance);
        const balance = {
          ...rawBalance,

          usd: usdBalance,
        } as BalancesType;

        accountsInfo[account.id] = {
          account,

          balance,
        };
      } catch (error) {
        console.error(
          `Error fetching balance for account ${account.id}:`,

          error,
        );
      }
    }),
  );

  return accountsInfo;
};

export const isAccountValid = async ({
  exchange,
  apikey,
  secret,
}: BalanceMutationParams): Promise<boolean> => {
  try {
    // 임시 CCXT 인스턴스 생성
    const exchangeInstance = new ccxt[exchange]({
      apiKey: apikey,
      secret: secret,
      enableRateLimit: true,
      options: {
        defaultType: "swap",
      },
    });

    // Bitget의 경우 password 설정
    if (exchange === "bitget") {
      exchangeInstance.password = "lazytrading";
    } else {
      // exchangeInstance.setSandboxMode(true);

      // Binance의 경우 헤더 설정
      if (exchange === "binance") {
        exchangeInstance.options.headers = {
          "X-MBX-APIKEY": apikey,
        };
      }
    }

    try {
      // 잔고 확인
      await exchangeInstance.fetchBalance();
      return true;
    } finally {
      // 인스턴스 정리
      if (exchangeInstance.close) {
        await exchangeInstance.close();
      }
    }
  } catch (error) {
    console.error("Account validation failed:", error);
    return false;
  }
};

// 계정별 CCXT 인스턴스 생성 함수 (별도 파일로 분리 추천)
export const createAccountInstance = async (
  exchange: ExchangeType,
  apiKey: string,
  secret: string,
) => {
  const exchangeCCXT = new ccxt[exchange]({
    apiKey,
    secret,
    enableRateLimit: true,
    options: {
      defaultType: "swap",
    },
  });

  const exchangePro = new ccxt.pro[exchange]({
    apiKey,
    secret,
    enableRateLimit: true,
    options: {
      defaultType: "swap",
    },
  });
  if (exchange != "bitget") {
    // exchangeCCXT.setSandboxMode(true);
    // exchangePro.setSandboxMode(true);
  }

  if (exchange == "bitget") {
    exchangeCCXT.password = "lazytrading";
    exchangePro.password = "lazytrading";
  }
  if (exchange == "binance") {
    exchangeCCXT.options.headers = {
      "X-MBX-APIKEY": apiKey,
    };
    exchangeCCXT.options.defaultType = "swap";
    exchangePro.options.headers = {
      "X-MBX-APIKEY": apiKey,
    };

    exchangePro.options.defaultType = "swap";
  }

  return {
    ccxt: exchangeCCXT,
    pro: exchangePro,
  };
};
