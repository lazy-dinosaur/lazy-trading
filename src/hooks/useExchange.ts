import { ExchangeType } from "./useAccounts";
import ccxt, { Exchange, Num, Ticker } from "ccxt";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useParams } from "react-router";
import { TimeFrameType } from "@/components/trade/time-frame";

interface BalanceMutationParams {
  exchange: ExchangeType;
  apikey: string;
  secret: string;
}

interface ExchangeInstances {
  [key: string]: {
    ccxt: Exchange;
    pro: Exchange;
  };
}

interface TickerWithExchange extends Ticker {
  exchange: ExchangeType;
}

const createExchangeInstances = (): ExchangeInstances => ({
  bybit: {
    ccxt: new ccxt.bybit(),
    pro: new ccxt.pro.bybit(),
  },
  binance: {
    ccxt: new ccxt.binance(),
    pro: new ccxt.pro.binance(),
  },
  bitget: {
    ccxt: new ccxt.bitget(),
    pro: new ccxt.pro.bitget(),
  },
});

export const supportExchanges: ExchangeType[] = ["bybit", "binance", "bitget"];

export const useExchange = () => {
  const exchangeInstancesRef = useRef<ExchangeInstances | null>(null);

  // Exchange 인스턴스 생성 및 정리
  useEffect(() => {
    exchangeInstancesRef.current = createExchangeInstances();

    return () => {
      // Cleanup function
      if (exchangeInstancesRef.current) {
        Object.values(exchangeInstancesRef.current).forEach(async ({ pro }) => {
          try {
            await pro.close(); // WebSocket 연결 정리
          } catch (error) {
            console.error("Error closing exchange connection:", error);
          }
        });
        exchangeInstancesRef.current = null;
      }
    };
  }, []);

  // Exchange 기본 정보 쿼리
  const exchangeData = useQuery({
    queryKey: ["exchanges", supportExchanges],
    queryFn: async () => {
      if (!exchangeInstancesRef.current) {
        throw new Error("Exchange instances not initialized");
      }

      const { bybit, binance, bitget } = exchangeInstancesRef.current;

      return {
        bybit: {
          ccxt: bybit.ccxt,
          pro: bybit.pro,
          features: bybit.ccxt.features,
        },
        binance: {
          ccxt: binance.ccxt,
          pro: binance.pro,
          features: binance.ccxt.features,
        },
        bitget: {
          ccxt: bitget.ccxt,
          pro: bitget.pro,
          features: bitget.ccxt.features,
        },
      };
    },
    refetchInterval: 10,
  });

  // 티커 정보 전용 쿼리
  const tickerData = useQuery({
    queryKey: ["tickers", supportExchanges],
    queryFn: async () => {
      if (!exchangeInstancesRef.current) {
        throw new Error("Exchange instances not initialized");
      }

      const { bybit, binance, bitget } = exchangeInstancesRef.current;

      const [
        bybitInverseTickers,
        bybitLinearTickers,
        binanceInverseTickers,
        binanceLinearTickers,
        bitgetInverseTickers,
        bitgetLinearTickers,
      ] = await Promise.all([
        bybit.ccxt.fetchTickers(undefined, {
          type: "swap",
          subType: "inverse",
        }),
        bybit.ccxt.fetchTickers(undefined, {
          type: "swap",
          subType: "linear",
        }),
        binance.ccxt.fetchTickers(undefined, {
          type: "swap",
          subType: "inverse",
        }),
        binance.ccxt.fetchTickers(undefined, {
          type: "swap",
          subType: "linear",
        }),
        bitget.ccxt.fetchTickers(undefined, {
          type: "swap",
          subType: "inverse",
        }),
        bitget.ccxt.fetchTickers(undefined, {
          type: "swap",
          subType: "linear",
        }),
      ]);

      const tickers: TickerWithExchange[] = [
        ...Object.values(bybitInverseTickers)
          .filter(
            (ticker) =>
              !ticker.symbol.includes("-") && !ticker.symbol.includes("_"),
          )
          .map((ticker) => ({
            ...ticker,
            exchange: "bybit" as ExchangeType,
          })),
        ...Object.values(bybitLinearTickers)
          .filter(
            (ticker) =>
              !ticker.symbol.includes("-") && !ticker.symbol.includes("_"),
          )
          .map((ticker) => ({
            ...ticker,
            exchange: "bybit" as ExchangeType,
          })),
        ...Object.values(binanceInverseTickers)
          .filter(
            (ticker) =>
              !ticker.symbol.includes("-") && !ticker.symbol.includes("_"),
          )
          .map((ticker) => ({
            ...ticker,
            exchange: "binance" as ExchangeType,
          })),
        ...Object.values(binanceLinearTickers)
          .filter(
            (ticker) =>
              !ticker.symbol.includes("-") && !ticker.symbol.includes("_"),
          )
          .map((ticker) => ({
            ...ticker,
            exchange: "binance" as ExchangeType,
          })),

        ...Object.values(bitgetInverseTickers)
          .filter(
            (ticker) =>
              !ticker.symbol.includes("-") && !ticker.symbol.includes("_"),
          )
          .map((ticker) => ({
            ...ticker,
            exchange: "bitget" as ExchangeType,
          })),
        ...Object.values(bitgetLinearTickers)
          .filter(
            (ticker) =>
              !ticker.symbol.includes("-") && !ticker.symbol.includes("_"),
          )
          .map((ticker) => ({
            ...ticker,
            exchange: "bitget" as ExchangeType,
          })),
      ];

      return tickers;
    },
    refetchInterval: 1000 * 30, // 30초마다 자동 갱신
  });
  const marketData = useQuery({
    queryKey: ["tickers", supportExchanges],
    queryFn: async () => {
      if (!exchangeInstancesRef.current) {
        throw new Error("Exchange instances not initialized");
      }
      const { bybit, binance, bitget } = exchangeInstancesRef.current;
      const bybitMarket = await bybit.ccxt.fetchMarkets();
      const binanceMarket = await binance.ccxt.fetchMarkets();
      const bitgetMarket = await bitget.ccxt.fetchMarkets();
      return {
        bybit: bybitMarket,
        binance: binanceMarket,
        bitget: bitgetMarket,
      };
    },
  });

  const fetchBalance = useMutation({
    mutationFn: async ({ exchange, apikey, secret }: BalanceMutationParams) => {
      if (!exchangeInstancesRef.current) {
        throw new Error("Exchange instances not initialized");
      }

      const exchangeInstance = exchangeInstancesRef.current[exchange].ccxt;
      exchangeInstance.apiKey = apikey;
      exchangeInstance.secret = secret;

      return await exchangeInstance.fetchBalance();
    },
  });

  const setExchange = useMutation({
    mutationFn: async ({ exchange, apikey, secret }: BalanceMutationParams) => {
      if (!exchangeInstancesRef.current) {
        throw new Error("Exchange instances not initialized");
      }

      const exchangeInstance = exchangeInstancesRef.current[exchange].ccxt;
      exchangeInstance.apiKey = apikey;
      exchangeInstance.secret = secret;

      return { success: true };
    },
  });

  return {
    exchangeData,
    tickerData,
    fetchBalance,
    marketData,
    setExchange,
  };
};
export const useOHLCV = ({
  timeFrame,
  start,
  end,
  limit,
}: {
  timeFrame: TimeFrameType;
  start?: Num;
  end?: Num;
  limit?: Num;
}) => {
  const params = useParams();
  const symbol = `${params.coin}/${params.base}`;
  const exchange = params.exchange as ExchangeType;

  const {
    exchangeData: { data, isLoading },
  } = useExchange();
  return useQuery({
    queryKey: [exchange, symbol, timeFrame],
    queryFn: async () => {
      if (!data || !data[exchange]) {
        throw new Error("Exchange instances not initialized");
      }
      const exchangeInstance = data[exchange].pro;
      return await exchangeInstance.fetchOHLCV(
        symbol,
        timeFrame,
        start,
        limit,
        { until: end },
      );
    },
    refetchInterval: 10,
    refetchIntervalInBackground: true,
    refetchOnMount: true,
    enabled: !isLoading && !!data,
  });
};
export const useTicker = () => {
  const params = useParams();
  const symbol = `${params.coin}/${params.base}`;
  const exchange = params.exchange as ExchangeType;

  const {
    exchangeData: { data, isLoading },
  } = useExchange();

  return useQuery<TickerWithExchange>({
    queryKey: [exchange, params.coin, params.base],
    queryFn: async () => {
      if (!data || !data[exchange]) {
        throw new Error("Exchange instances not initialized");
      }
      const exchangeInstance = data[exchange].ccxt;
      const ticker = await exchangeInstance.fetchTicker(symbol);
      return { ...ticker, exchange };
    },
    enabled:
      !!params.coin &&
      !!params.exchange &&
      !!params.base &&
      !!data &&
      !isLoading,
    refetchInterval: 200,
    refetchIntervalInBackground: true,
    refetchOnMount: true,
  });
};
