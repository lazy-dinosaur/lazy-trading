import { useMarketInfo, useFetchTicker } from "@/hooks/coin";
import {
  useInitialLoading,
  useBalanceInfo,
  useLeverageInfo,
  useTradeInfo,
} from "@/hooks/trade";
import { ExchangeType } from "@/lib/accounts";
import { useSearchParams } from "react-router";
import { useAccounts } from "../accounts/use";
import { TradeContext } from "./type";

export const TradeProvider = ({ children }: { children: React.ReactNode }) => {
  const { isLoaded, exchangeAccounts } = useInitialLoading();
  const [searchParams] = useSearchParams();

  const exchange = searchParams.get("exchange") as ExchangeType;
  const symbol = decodeURIComponent(searchParams.get("symbol")!) as string;
  const id = searchParams.get("id")!;
  const base = symbol?.split(":")[1];

  const {
    accountsBalance,
    decryptedAccounts,
    isLoading: isAccountsLoading,
  } = useAccounts();

  const balanceInfo = useBalanceInfo(id, symbol, exchange);

  const { data: leverageInfo } = useLeverageInfo(
    exchange,
    symbol,
    id ? decryptedAccounts?.[id] : undefined,
  );

  const tradeInfo = useTradeInfo(
    exchange,
    symbol,
    leverageInfo,
    exchange == "binance"
      ? accountsBalance?.[id]?.balance[base]?.total
        ? Number(accountsBalance[id]?.balance[base]?.total)
        : 0
      : accountsBalance?.[id]?.balance[base]?.free
        ? Number(accountsBalance[id]?.balance[base]?.free)
        : 0,
    id, // accountId 추가
  );

  const marketInfoQuery = useMarketInfo(exchange, symbol);
  const tickerQuery = useFetchTicker({ exchange, symbol });

  return (
    <TradeContext.Provider
      value={{
        tradeInfo,
        marketInfoQuery,
        tickerQuery,
        exchangeAccounts,
        accountsBalance,
        isAccountsLoading,
        isLoaded,
        balanceInfo,
      }}
    >
      {children}
    </TradeContext.Provider>
  );
};
