import { useFetchTicker } from "@/hooks/coin";
import { DecryptedAccount, ExchangeType } from "@/lib/accounts";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { useCache } from "@/contexts/cache/use";
import { useAccounts } from "@/contexts/accounts/use";
import { TradeContext } from "./type";

export const TradeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [exchangeAccounts, setExchangeAccounts] =
    useState<DecryptedAccount[]>();

  const {
    decryptedAccounts,
    accountsDetails,
    isLoading: isAccountsLoading,
  } = useAccounts();
  const { cache, isLoading: isCacheLoading } = useCache();

  const [searchParams, setSearchParams] = useSearchParams();

  const exchange = searchParams.get("exchange")! as ExchangeType;
  const symbol = decodeURIComponent(searchParams.get("symbol")!) as string;
  const timeframe = searchParams.get("timeframe");
  const id = searchParams.get("id");

  const tickerQuery = useFetchTicker({
    exchange,
    symbol,
  });

  //초기 시간봉 설정
  useEffect(() => {
    if (!isLoaded && !timeframe && !isCacheLoading) {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.set("timeframe", cache?.data.timeframe || "30");
        return newParams;
      });
    }
  }, [
    cache,
    isLoaded,
    isCacheLoading,
    setSearchParams,
    searchParams,
    timeframe,
  ]);

  // 초기 계정 설정
  useEffect(() => {
    if (!isAccountsLoading && !isLoaded && timeframe) {
      if (decryptedAccounts) {
        const filteredAccounts = Object.values(decryptedAccounts).filter(
          (account) => account.exchange == exchange,
        );
        setExchangeAccounts(filteredAccounts);
        if (filteredAccounts && filteredAccounts.length > 0) {
          setSearchParams((prev) => {
            const newParams = new URLSearchParams(prev);
            newParams.set("id", filteredAccounts[0].id);
            return newParams;
          });
        }
      }
      setIsLoaded(true);
    }
  }, [
    decryptedAccounts,
    isAccountsLoading,
    isLoaded,
    id,
    setSearchParams,
    exchange,
    timeframe,
  ]);

  return (
    <TradeContext.Provider
      value={{
        tickerQuery,
        exchangeAccounts,
        accountsDetails,
        isAccountsLoading,
        isLoaded,
      }}
    >
      {children}
    </TradeContext.Provider>
  );
};
