import { EncryptedData, decryptKey, encryptKey } from "./cryptography";
import ccxt, {
  Balances,
  binance,
  bitget,
  bybit,
  Exchange,
  Position,
} from "ccxt";

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

export type AccountInfo = {
  account: DecryptedAccount;
  balance: BalancesType;
  positions: Position[];
  positionsHistory: Position[];
  // orders: {
  //   open: Order[];
  //   closed: Order[];
  // };
};

export type AccountInfoType = {
  [keyof: string]: AccountInfo;
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

export async function calculateUSDBalance(
  exchange: Exchange,
  balance: Balances,
): Promise<USDBalance> {
  const usdBalance: USDBalance = {
    total: 0,
    used: 0,
    free: 0,
  };

  try {
    // console.log("Raw balance:", balance);

    // balance 객체에서 실제 자산 데이터만 필터링
    const assets = Object.entries(balance).filter(([key, value]) => {
      // 메타데이터 필드 제외
      if (
        ["info", "timestamp", "datetime", "free", "used", "total"].includes(key)
      ) {
        return false;
      }
      // value가 객체이고 필요한 속성을 가지고 있는지 확인
      return (
        value &&
        typeof value === "object" &&
        ("free" in value || "used" in value || "total" in value) &&
        ((value.free ?? 0) > 0 || (value.used ?? 0) > 0)
      );
    });

    // console.log("Filtered assets:", assets);

    await Promise.all(
      assets.map(async ([currency, value]) => {
        try {
          // console.log(`Processing ${currency}:`, value);

          let price = 1; // USDT/USD의 경우 기본값 1

          if (currency !== "USDT" && currency !== "USD") {
            const symbol = `${currency}/USDT`;
            // console.log(`Fetching ticker for ${symbol}`);

            try {
              const ticker = await exchange.fetchTicker(symbol);
              // console.log(`Ticker for ${symbol}:`, ticker);

              if (ticker && ticker.last) {
                price = ticker.last;
                // console.log(`Price found for ${currency}: ${price}`);
              }
            } catch (error) {
              console.log(
                `Failed to fetch USDT ticker for ${currency}:`,
                error,
              );
              // USDT 마켓이 없는 경우 USD 마켓 시도
              try {
                const usdSymbol = `${currency}/USD`;
                // console.log(`Trying USD market: ${usdSymbol}`);

                const ticker = await exchange.fetchTicker(usdSymbol);
                // console.log(`USD Ticker for ${usdSymbol}:`, ticker);

                if (ticker && ticker.last) {
                  price = ticker.last;
                  // console.log(`USD Price found for ${currency}: ${price}`);
                }
              } catch (error) {
                console.warn(
                  `No USD/USDT market found for ${currency}:`,
                  error,
                );
                return; // 이 자산은 건너뜀
              }
            }
          }

          let freeValue = (value.free || 0) * price;
          const usedValue = (value.used || 0) * price;
          let totalValue = (value.total || 0) * price;

          // Swap free and total for Binance
          if (exchange.id === "binance") {
            [freeValue, totalValue] = [totalValue, freeValue];
          }

          // console.log(`Calculated values for ${currency}:`, {
          //   free: freeValue,
          //   used: usedValue,
          //   total: totalValue,
          //   price,
          // });

          usdBalance.free += freeValue;
          usdBalance.used += usedValue;
          usdBalance.total += totalValue;

          // console.log("Current running totals:", {
          //   free: usdBalance.free,
          //   used: usdBalance.used,
          //   total: usdBalance.total,
          // });
        } catch (error) {
          console.error(
            `Failed to calculate USD value for ${currency}:`,
            error,
          );
        }
      }),
    );

    // console.log("Final USD balance before rounding:", usdBalance);
  } catch (error) {
    console.error("Error calculating USD balance:", error);
  }

  // 소수점 2자리까지 반올림
  const result = {
    total: Math.round(usdBalance.total * 100) / 100,
    used: Math.round(usdBalance.used * 100) / 100,
    free: Math.round(usdBalance.free * 100) / 100,
  };

  // console.log("Final rounded USD balance:", result);
  return result;
}

export const fetchAccountsDetail = async (data?: DecryptedAccountObj) => {
  if (!data) throw new Error("Accounts or exchange data not available");

  const accountsInfo: AccountInfoType = {};
  const accounts = Object.values(data);

  await Promise.all(
    accounts.map(async (account) => {
      try {
        const exchangeInstance = account.exchangeInstance.ccxt;

        const rawBalance = await exchangeInstance.fetchBalance();
        console.log("rawBalance:", rawBalance);

        const usdBalance = await calculateUSDBalance(
          exchangeInstance,
          rawBalance,
        );
        // console.log("usd:", usdBalance);

        // 포지션 조회
        let positions: Position[] = [];
        try {
          positions = await exchangeInstance.fetchPositions();
        } catch (error) {
          console.warn(
            `Failed to fetch positions for ${account.exchange}:`,
            error,
          );
        }

        // 포지션 히스토리 조회 (바이낸스는 미지원)
        let positionsHistory: Position[] = [];
        if (account.exchange !== "binance") {
          try {
            positionsHistory = await exchangeInstance.fetchPositionsHistory();
          } catch (error) {
            console.warn(
              `Failed to fetch positions history for ${account.exchange}:`,
              error,
            );
          }
        }

        const balance = {
          ...rawBalance,
          usd: usdBalance,
        } as BalancesType;

        accountsInfo[account.id] = {
          account,
          balance,
          positions,
          positionsHistory,
          // orders: { open, closed },
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
      exchangeInstance.setSandboxMode(true);

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
    exchangeCCXT.setSandboxMode(true);
    exchangePro.setSandboxMode(true);
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
