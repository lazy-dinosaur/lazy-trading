import { useAccounts } from "@/contexts/accounts/use";
import { useCache } from "@/contexts/cache/use";
import { useCCXT } from "@/contexts/ccxt/use";
import { useChartData } from "@/contexts/chart-data/use";
import { useTradingConfig } from "@/contexts/settings/use";
import { FormattedCurrecy, TradeInfoType } from "@/contexts/trade/type";
import { DecryptedAccount, ExchangeType } from "@/lib/accounts";
import { searchingStopLossCandle } from "@/lib/chart";
import { useTradingFees, calculatePositionInfo } from "@/lib/trade";
import { formatUSDValue } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { useMarketInfo } from "./coin";
import { LeverageTier } from "ccxt";

export const useInitialLoading = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  const [exchangeAccounts, setExchangeAccounts] =
    useState<DecryptedAccount[]>();

  const { decryptedAccounts, isLoading: isAccountsLoading } = useAccounts();
  const { cache, isLoading: isCacheLoading } = useCache();

  const [searchParams, setSearchParams] = useSearchParams();

  const exchange = searchParams.get("exchange") as ExchangeType;
  const timeframe = searchParams.get("timeframe");
  const id = searchParams.get("id");
  const ccxt = useCCXT();

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
  return { isLoaded, exchangeAccounts };
};

// 1. 잔고 정보 관련 훅
export const useBalanceInfo = (
  id?: string,
  symbol?: string,
  exchange?: ExchangeType,
) => {
  const [balanceInfo, setBalanceInfo] = useState<{
    base: FormattedCurrecy & { name: string };
    usd: FormattedCurrecy;
  }>();

  const { accountsDetails, isLoading: isAccountsLoading } = useAccounts();
  const base = symbol?.split(":")[1];

  useEffect(() => {
    const isParamsLoaded = !!(id && symbol && exchange && base);
    const isAccountLoaded = !!(accountsDetails && !isAccountsLoading);

    if (isParamsLoaded && isAccountLoaded) {
      const currentAccount = accountsDetails[id];
      const usdBalance = currentAccount?.balance?.usd;
      const baseBalance = currentAccount?.balance[base];

      if (!usdBalance && !baseBalance) return;

      const formattedUSD: FormattedCurrecy = {
        total: formatUSDValue(usdBalance.total),
        used: formatUSDValue(usdBalance.used),
        free: formatUSDValue(usdBalance.free),
      };

      let formattedBase: FormattedCurrecy = {
        total: "0",
        used: "0",
        free: "0",
      };

      if (base == "USDT" || base == "USDC") {
        formattedBase = {
          total: formatUSDValue(baseBalance.total),
          used: formatUSDValue(baseBalance.used),
          free: formatUSDValue(baseBalance.free),
        };
      } else {
        formattedBase = { ...baseBalance };
      }

      setBalanceInfo({
        base: { ...formattedBase, name: base },
        usd: formattedUSD,
      });
    }
  }, [accountsDetails, isAccountsLoading, id, symbol, exchange, base]);

  return balanceInfo;
};

// 2. 거래 정보 관련 훅
export const useTradeInfo = (
  exchange: ExchangeType,
  symbol: string,
  leverageInfo?: { maxLeverage: number; leverageTier?: LeverageTier[] },
  availableBalance?: number,
) => {
  const [tradeInfo, setTradeInfo] = useState<TradeInfoType>();
  const ccxt = useCCXT();
  const { config, isLoading: isTradingConfigLoading } = useTradingConfig();
  const { data: candleData, isLoading: isCandleLoading } = useChartData();
  const { data: tradingfee, isLoading: isTradingfeeLoading } = useTradingFees(
    exchange,
    symbol,
  );
  const { data: marketInfo, isLoading: isMarketLoading } = useMarketInfo(
    exchange,
    symbol,
  );

  useEffect(() => {
    const isCandleExists =
      !!candleData && candleData.length > 0 && !isCandleLoading;
    const isTradingfeeExists = !!tradingfee && !isTradingfeeLoading;
    const isMarketInfoExists = !!marketInfo && !isMarketLoading;
    const isConfigExists = !!config && !isTradingConfigLoading;
    const isLeverageExists = !!leverageInfo;

    if (
      ccxt &&
      isCandleExists &&
      isTradingfeeExists &&
      isMarketInfoExists &&
      isConfigExists &&
      isLeverageExists
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

      const tradingFees = {
        maker: tradingfee.maker as number,
        taker: tradingfee.taker as number,
      };

      const longInfo = calculatePositionInfo({
        currentPrice,
        stopLossPrice: stopLossLow,
        riskRatio: config.riskRatio,
        risk: config.risk,
        ccxtInstance: ccxt[exchange].ccxt,
        symbol,
        isLong: true,
        availableBalance,
        leverageInfo,
        tradingFee: tradingFees,
      });

      const shortInfo = calculatePositionInfo({
        currentPrice,
        stopLossPrice: stopLossHigh,
        riskRatio: config.riskRatio,
        risk: config.risk,
        ccxtInstance: ccxt[exchange].ccxt,
        symbol,
        isLong: false,
        availableBalance,
        leverageInfo,
        tradingFee: tradingFees,
      });

      if (longInfo && shortInfo) {
        setTradeInfo({
          long: longInfo,
          short: shortInfo,
          currentPrice,
          tradingfee: tradingFees,
          leverageInfo,
        });
      }
    }
  }, [
    availableBalance,
    ccxt,
    exchange,
    symbol,
    config,
    candleData,
    tradingfee,
    marketInfo,
    leverageInfo,
    isCandleLoading,
    isTradingfeeLoading,
    isMarketLoading,
    isTradingConfigLoading,
  ]);

  return tradeInfo;
};

// 3. 최대 레버리지 관련 훅
export const useLeverageInfo = (
  exchange: ExchangeType,
  symbol: string,
  account?: DecryptedAccount,
) => {
  const ccxt = useCCXT();

  return useQuery({
    queryKey: ["maxLeverage", exchange, symbol, account?.id],
    queryFn: async () => {
      if (!ccxt) return;

      // 바이낸스의 경우
      if (exchange === "binance") {
        if (!account) {
          return { maxLeverage: 125, leverageTier: [] };
        }
      }

      // 바이낸스가 아닌 경우 (기존 코드)
      const exchangeInstance = account
        ? account.exchangeInstance.ccxt
        : ccxt[exchange].ccxt;
      try {
        // 바이낸스는 linear/inverse 구분이 필요
        const leverageTierLinear = await exchangeInstance.fetchLeverageTiers(
          undefined,
          { category: "linear" },
        );
        console.log("Linear tiers:", leverageTierLinear);

        const leverageTierInverse = await exchangeInstance.fetchLeverageTiers(
          undefined,
          { category: "inverse" },
        );
        console.log("Inverse tiers:", leverageTierInverse);

        const combinedTiers = {
          ...leverageTierInverse,
          ...leverageTierLinear,
        };
        const symbolTiers = combinedTiers[symbol];

        console.log("Combined tiers for symbol:", symbolTiers);

        if (!symbolTiers || symbolTiers.length === 0) {
          return { maxLeverage: 125, leverageTier: [] };
        }

        return {
          leverageTier: symbolTiers,
          maxLeverage: symbolTiers[0].maxLeverage ?? 125,
        };
      } catch (error) {
        console.error("Error fetching Binance leverage tiers:", error);
        return { maxLeverage: 125, leverageTier: [] };
      }
    },
    enabled: !!symbol && !!exchange,
  });
};

// export const useOrder = ({
//   exchange,
//   account,
//   symbol,
//   tradeInfo,
// }: {
//   exchange?: ExchangeType;
//   account?: DecryptedAccount;
//   symbol: string;
//   tradeInfo: TradeInfoType;
// }) => {
//   const ccxt = useCCXT();
//
//   const createOrder = useMutation({
//     mutationKey: ["order"],
//     mutationFn: async ({
//       isLong,
//       partialClose,
//     }: {
//       isLong: boolean;
//       partialClose?: {
//         portion: number;
//         slToEven: boolean;
//       };
//     }) => {
//       if (
//         !ccxt ||
//         !exchange ||
//         !symbol ||
//         !tradeInfo ||
//         !tradeInfo.short.position ||
//         !tradeInfo.long.position ||
//         !account
//       ) {
//         console.log("Required parameters missing"); // 어떤 조건에서 실패했는지 확인
//         return;
//       }
//       const ccxtInstance = ccxt[exchange].ccxt;
//       ccxtInstance.apiKey = account.apiKey;
//       ccxtInstance.secret = account.secretKey;
//       const side = isLong ? "buy" : "sell";
//       const { stoploss, target, position } =
//         tradeInfo[isLong ? "long" : "short"];
//
//       const stopLossPrice = stoploss.price;
//       const targetPrice = target.price;
//       const positionSize = position!.size;
//       console.log(targetPrice);
//       console.log(partialClose);
//
//       const setLeverage = await ccxtInstance.setLeverage(
//         tradeInfo?.maxLeverage,
//         symbol,
//         { category: "linear" },
//       );
//       console.log(setLeverage);
//       console.log("exchange", exchange);
//       console.log("positionSize", positionSize);
//       //createOrder
//       if (exchange == "bybit") {
//         const positionIdx = isLong ? 1 : 2;
//         const order = await ccxtInstance.createOrder(
//           symbol,
//           "market",
//           side,
//           positionSize,
//           undefined,
//           { stopLossPrice, positionIdx },
//         );
//         console.log(order);
//         return order;
//       }
//     },
//   });
//
//   return createOrder;
// };
