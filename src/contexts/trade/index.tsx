import { useFetchTicker, useMarketInfo } from "@/hooks/coin";
import { DecryptedAccount, ExchangeType } from "@/lib/accounts";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { useCache } from "@/contexts/cache/use";
import { useAccounts } from "@/contexts/accounts/use";
import { TradeContext, TradeInfoType } from "./type";
import { searchingStopLossCandle } from "@/lib/chart";
import { useChartData } from "../chart-data/use";
import { calculatePositionInfo, useTradingFees } from "@/lib/trade";
import { useCCXT } from "../ccxt/use";
import { useTradingConfig } from "../settings/use";

export const TradeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [, setTradeInfo] = useState<TradeInfoType>();

  const { config, isLoading: isTradingConfigLoading } = useTradingConfig();

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
  const ccxt = useCCXT();

  const tickerQuery = useFetchTicker({
    exchange,
    symbol,
  });
  const marketInfoQuery = useMarketInfo(exchange, symbol);

  const { data: tradingfee, isLoading: isTradingfeeLoading } = useTradingFees(
    exchange! as ExchangeType,
    symbol,
  );

  const { data: marketInfo, isLoading: isMarketLoading } = useMarketInfo(
    exchange as ExchangeType,
    symbol,
  );
  const { data: candleData, isLoading: isCandleLoading } = useChartData();
  useEffect(() => {
    console.log(symbol);
    console.log(tradingfee);
  }, [tradingfee, symbol]);

  useEffect(() => {
    const isCandleExists =
      !!candleData && candleData.length > 0 && !isCandleLoading;
    const isTradingfeeExists = !!tradingfee && !isTradingfeeLoading;
    const isMarketInfoExists = !!marketInfo && !isMarketLoading;
    const isConfigExsits = !!config && !isTradingConfigLoading;

    if (
      ccxt &&
      isCandleExists &&
      isTradingfeeExists &&
      isMarketInfoExists &&
      isConfigExsits
    ) {
      const currentPrice = candleData[candleData.length - 1].close;

      const stopLossHigh = searchingStopLossCandle(
        candleData,
        candleData.length - 1,
        "high",
      ).high;

      const stopLossLow = searchingStopLossCandle(
        candleData,
        candleData.length - 1,
        "low",
      ).low;

      // const availableBalance = data?.[id]?.balance?.free?.USDT;

      const tradingFees = {
        maker: tradingfee.maker as number,
        taker: tradingfee.taker as number,
      };

      const longInfo = calculatePositionInfo(
        currentPrice,
        stopLossLow,
        config.riskRatio,
        config.risk,
        ccxt[exchange].ccxt,
        symbol,
        true,
        undefined,
        tradingFees,
      );

      const shortInfo = calculatePositionInfo(
        currentPrice,
        stopLossHigh,
        config.riskRatio,
        config.risk,
        ccxt[exchange].ccxt,
        symbol,
        false,
        undefined,
        tradingFees,
      );

      setTradeInfo({
        long: longInfo,
        short: shortInfo,
        currentPrice,
        tradingfee: {
          taker: tradingfee.taker as number,
          maker: tradingfee.maker as number,
        },
        maxLeverage: marketInfo.limits?.leverage?.max || 0,
      });
    }
  }, [
    ccxt,
    exchange,
    symbol,
    isTradingConfigLoading,
    config,
    isCandleLoading,
    candleData,
    isTradingfeeLoading,
    tradingfee,
    isMarketLoading,
    marketInfo,
  ]);

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
    ccxt,
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
        marketInfoQuery,
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
