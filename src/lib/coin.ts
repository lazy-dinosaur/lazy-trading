import { CCXTType } from "@/contexts/ccxt/type";
import { ExchangeType } from "./accounts";
import { TickerWithExchange } from "./ccxt";

export const fetchAllTickers = async (ccxt: CCXTType) => {
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
    return ticker;
  }
};

export const fetchMarketInfo = async (
  ccxt: any,
  exchange: ExchangeType,
  symbol: string,
) => {
  if (!ccxt?.[exchange]) {
    throw new Error("Exchange instance not initialized");
  }

  try {
    const exchangeInstance = ccxt[exchange].pro;
    await exchangeInstance.loadMarkets();
    const market = exchangeInstance.market(symbol);

    return {
      maxLeverage: market.limits?.leverage?.max || 0,
      // 기타 필요한 마켓 정보들
    };
  } catch (error) {
    console.error(`Error fetching market info:`, error);
    return null;
  }
};
