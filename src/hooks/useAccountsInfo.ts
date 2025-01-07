import { useQuery } from "@tanstack/react-query";
import { useAccounts } from "./useAccounts";
import { useExchange } from "./useExchange";
import { Balances, Position, Trade } from "ccxt";
type AccountInfoType = {
  [keyof: string]: {
    balance: Balances;
    positions: Position[];
    trades: Trade[];
  };
};

export const useAccountsInfo = () => {
  const { useAllDecryptedAccounts } = useAccounts();
  const { data: decryptedAccounts, isLoading: isAccountsLoading } =
    useAllDecryptedAccounts();
  const {
    exchangeData: { data: exchangeData, isLoading: isExchangeLoading },
  } = useExchange();

  return useQuery({
    queryKey: ["accountsInfo"],
    queryFn: async () => {
      if (!decryptedAccounts || !exchangeData) {
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

            const balance = await exchangeInstance.fetchBalance();
            const positions = await exchangeInstance.fetchPositions();
            const trades = await exchangeInstance.fetchMyTrades();

            accountsInfo[account.id] = {
              balance,
              positions,
              trades,
            };
          } catch (error) {
            console.error(
              `Error fetching balance for account ${account.id}:`,
              error,
            );
            // 에러가 발생해도 다른 계정의 정보는 계속 가져올 수 있도록 함
            accountsInfo[account.id] = {
              balance: {} as Balances,
              positions: [] as Position[],
              trades: [] as Trade[],
            };
          }
        }),
      );

      return accountsInfo;
    },
    enabled: !isAccountsLoading && !isExchangeLoading,
    refetchInterval: 200,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchIntervalInBackground: true,
  });
};
