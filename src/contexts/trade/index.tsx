import { useMarketInfo, useFetchTicker } from "@/hooks/coin";
import {
  useInitialLoading,
  useBalanceInfo,
  useMaxLeverage,
  useTradeInfo,
  useOrder,
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
    accountsDetails,
    decryptedAccounts,
    isLoading: isAccountsLoading,
  } = useAccounts();

  const balanceInfo = useBalanceInfo(id, symbol, exchange);

  const { data: maxLeverage } = useMaxLeverage(
    exchange,
    symbol,
    id ? decryptedAccounts?.[id] : undefined,
  );

  const tradeInfo = useTradeInfo(
    exchange,
    symbol,
    maxLeverage,
    accountsDetails?.[id]?.balance[base]?.free
      ? Number(accountsDetails[id]?.balance[base]?.free)
      : 0,
  );

  const createOrder = useOrder({
    exchange,
    account: id ? decryptedAccounts?.[id] : undefined,
    symbol,
    tradeInfo,
  });

  const marketInfoQuery = useMarketInfo(exchange, symbol);
  const tickerQuery = useFetchTicker({ exchange, symbol });

  return (
    <TradeContext.Provider
      value={{
        tradeInfo,
        marketInfoQuery,
        tickerQuery,
        exchangeAccounts,
        accountsDetails,
        isAccountsLoading,
        isLoaded,
        balanceInfo,
        createOrder,
      }}
    >
      {children}
    </TradeContext.Provider>
  );
};
