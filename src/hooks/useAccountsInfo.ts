import { useQuery } from "@tanstack/react-query";
import { useAccounts } from "./useAccounts";
import { useExchange } from "./useExchange";
import { Balances, Position, Exchange, Balance, Order } from "ccxt";

interface USDBalance {
  total: number;
  used: number;
  free: number;
}
export type BalancesType = Balances &
  Balance & {
    [keyof: string]: any;
    usd: USDBalance;
  };

async function calculateUSDBalance(
  exchange: Exchange,
  balance: Balances,
): Promise<USDBalance> {
  const usdBalance: USDBalance = {
    total: 0,
    used: 0,
    free: 0,
  };

  try {
    const assets = Object.entries(balance).filter(
      ([, value]) => (value.free ?? 0) > 0 || (value.used ?? 0) > 0,
    );

    await Promise.all(
      assets.map(async ([currency, value]) => {
        try {
          let price = 1; // USDT/USD의 경우 기본값 1

          if (currency !== "USDT" && currency !== "USD") {
            try {
              const ticker = await exchange.fetchTicker(`${currency}/USDT`);
              if (ticker && ticker.last) {
                price = ticker.last;
              }
            } catch {
              // USDT 마켓이 없는 경우 USD 마켓 시도
              try {
                const ticker = await exchange.fetchTicker(`${currency}/USD`);
                if (ticker && ticker.last) {
                  price = ticker.last;
                }
              } catch {
                console.warn(`No USD/USDT market found for ${currency}`);
                return; // 이 자산은 건너뜀
              }
            }
          }

          usdBalance.free += (value.free || 0) * price;
          usdBalance.used += (value.used || 0) * price;
          usdBalance.total += (value.total || 0) * price;
        } catch (error) {
          console.warn(`Failed to calculate USD value for ${currency}:`, error);
        }
      }),
    );
  } catch (error) {
    console.error("Error calculating USD balance:", error);
  }

  // 소수점 2자리까지 반올림
  return {
    total: Math.round(usdBalance.total * 100) / 100,
    used: Math.round(usdBalance.used * 100) / 100,
    free: Math.round(usdBalance.free * 100) / 100,
  };
}
export type AccountInfo = {
  balance: BalancesType;
  positions: Position[];
  positionsHistory: Position[];
  orders: {
    open: Order[];
    closed: Order[];
  };
};

export type AccountInfoType = {
  [keyof: string]: AccountInfo;
};

export const useAccountsInfo = () => {
  const { useAllDecryptedAccounts } = useAccounts();
  const { data: decryptedAccounts, isLoading: isAccountsLoading } =
    useAllDecryptedAccounts();
  const {
    exchangeData: { data: exchangeData, isLoading: isExchangeLoading },
    tickerData: { data: tickerData, isLoading: isTickerLoading },
  } = useExchange();

  return useQuery({
    queryKey: ["accountsInfo"],
    queryFn: async () => {
      if (!decryptedAccounts || !exchangeData || !tickerData) {
        throw new Error("Accounts or exchange data not available");
      }

      const accountsInfo: AccountInfoType = {};
      const accounts = Object.values(decryptedAccounts);

      // Promise.all을 사용하여 모든 비동기 작업이 완료될 때까지 대기
      await Promise.all(
        accounts.map(async (account) => {
          try {
            const exchangeInstance = exchangeData[account.exchange].pro;
            exchangeInstance.apiKey = account.apiKey;
            exchangeInstance.secret = account.secretKey;

            const rawBalance = await exchangeInstance.fetchBalance();
            const usdBalance = await calculateUSDBalance(
              exchangeInstance,
              rawBalance,
            );
            const positions = await exchangeInstance.fetchPositions();
            // 다른 거래소는 기존 방식대로 처리
            //
            const closed = await exchangeInstance.fetchClosedOrders(
              undefined,
              undefined,
              100,
            );
            const open = await exchangeInstance.fetchOpenOrders(
              undefined,
              undefined,
              100,
            );
            const positionsHistory =
              await exchangeInstance.fetchPositionsHistory();

            // 원래 balance 정보와 USD 환산 정보를 합침
            const balance = {
              ...rawBalance,
              usd: usdBalance,
            } as BalancesType;
            console.log(balance);

            accountsInfo[account.id] = {
              balance,
              positions,
              positionsHistory,
              orders: {
                open,
                closed,
              },
            };
          } catch (error) {
            console.error(
              `Error fetching balance for account ${account.id}:`,
              error,
            );
            // 에러가 발생해도 다른 계정의 정보는 계속 가져올 수 있도록 함
            accountsInfo[account.id] = {
              balance: {} as BalancesType,
              positions: [] as Position[],
              positionsHistory: [] as Position[],
              orders: {
                open: [] as Order[],
                closed: [] as Order[],
              },
            };
          }
        }),
      );

      return accountsInfo;
    },
    enabled: !isAccountsLoading && !isExchangeLoading && !isTickerLoading,
    refetchInterval: 500,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchIntervalInBackground: true,
  });
};
