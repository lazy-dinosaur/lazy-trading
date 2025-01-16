import { useQuery } from "@tanstack/react-query";
import { CCXTType, supportExchanges, useCCXT } from "./ccxt";
import { TickerWithExchange } from "@/lib/ccxtUtils";
import { ExchangeType } from "./useAccounts";
const fetchAllTickers = async (ccxt: CCXTType) => {
  if (ccxt) {
    const { bybit, binance, bitget } = ccxt;

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
  }
};

// 티커 정보 전용 쿼리
export const useAllTickers = () => {
  const { data: ccxt, isLoading } = useCCXT();
  return useQuery({
    queryKey: ["allTickers", supportExchanges],
    queryFn: async () => ccxt && (await fetchAllTickers(ccxt)),
    refetchInterval: 1000 * 30, // 30초마다 자동 갱신
    enabled: !isLoading && !!ccxt,
  });
};

export const fetchTicker = async ({
  ccxt,
  exchange,
  symbol,
}: {
  ccxt: CCXTType;
  exchange: ExchangeType;
  symbol: string;
}) => {
  if (ccxt) {
    const exchangeInstance = ccxt[exchange].ccxt;
    const ticker = await exchangeInstance.fetchTicker(symbol);
    return { ...ticker, exchange };
  }
};

export const useFetchTicker = ({
  exchange,
  symbol,
}: {
  exchange: ExchangeType;
  symbol: string;
}) => {
  const { data: ccxt, isLoading } = useCCXT();
  return useQuery({
    queryKey: [exchange, symbol, "ticker"],
    queryFn: async () =>
      ccxt ? await fetchTicker({ ccxt, exchange, symbol }) : undefined,
    enabled: !!ccxt && !isLoading && !!exchange && !!symbol,
    refetchInterval: 500,
    refetchIntervalInBackground: true,
    refetchOnMount: true,
  });
};
