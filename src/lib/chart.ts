import { ExchangeType } from "@/lib/accounts";
import { TimeFrameType } from "@/components/trade/time-frame";
import { CCXTType } from "@/hooks/use-ccxt-context";
import { CandleData } from "@/components/chart/candle-types";

export const getFormattedTimeframe = (
  exchange: ExchangeType,
  timeframe: TimeFrameType,
) => {
  switch (exchange) {
    case "binance":
      switch (timeframe) {
        case "60":
          return "1h";
        case "240":
          return "4h";
        case "D":
          return "1d";
        case "W":
          return "1w";
        case "M":
          return "1M";
        default:
          return `${timeframe}m`;
      }
    case "bybit":
      switch (timeframe) {
        case "D":
          return "D";
        case "W":
          return "W";
        case "M":
          return "M";
        default:
          return timeframe;
      }
    case "bitget":
      switch (timeframe) {
        case "60":
          return "1h";
        case "240":
          return "4h";
        case "D":
          return "1d";
        case "W":
          return "1w";
        case "M":
          return "1M";
        default:
          return `${timeframe}m`;
      }
    default:
      return timeframe;
  }
};

export const getTimeframeMilliseconds = (timeframe: TimeFrameType) => {
  switch (timeframe) {
    case "D":
      return 24 * 60 * 60 * 1000;
    case "W":
      return 7 * 24 * 60 * 60 * 1000;
    case "M":
      return 30 * 24 * 60 * 60 * 1000;
    default:
      return parseInt(timeframe) * 60 * 1000;
  }
};

export const getHistoricalRange = (
  exchange: ExchangeType,
  timeframe: TimeFrameType,
) => {
  const timeframeMs = getTimeframeMilliseconds(timeframe);
  const defaultRange = timeframeMs * 250;

  switch (exchange) {
    case "binance":
      return Math.min(defaultRange, 200 * 24 * 60 * 60 * 1000);
    case "bitget":
      return Math.min(defaultRange, 90 * 24 * 60 * 60 * 1000);
    default:
      return defaultRange;
  }
};

export const fetchHistoricalOHLCV = async ({
  pageParam,
  ccxt,
  exchange,
  timeframe,
  symbol,
}: {
  pageParam: number;
  ccxt: CCXTType | null;
  exchange: ExchangeType;
  timeframe: TimeFrameType;
  symbol: string;
}) => {
  if (!ccxt || !ccxt[exchange]) {
    throw new Error("Exchange instances not initialized");
  }

  const exchangeInstance = ccxt[exchange].pro;
  const until = pageParam as number;
  const range = getHistoricalRange(exchange, timeframe);
  const since = until - range;

  try {
    const formattedTimeframe = getFormattedTimeframe(exchange, timeframe);
    const OHLCV = await exchangeInstance.fetchOHLCV(
      symbol,
      formattedTimeframe,
      since,
      250,
      {
        until,
        ...(exchange === "binance" && {
          limit: 250,
          endTime: until,
        }),
        ...(exchange === "bitget" && {
          endTime: until,
          limit: 250,
        }),
        ...(exchange === "bybit" && {
          limit: 250,
        }),
      },
    );

    if (!OHLCV || OHLCV.length === 0) {
      return {
        data: [],
        nextCursor: undefined,
      };
    }

    const formattedData = OHLCV.map((candle) => ({
      time: (candle[0] as number) / 1000,
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
      volume: candle[5],
    })) as CandleData[];

    return {
      data: formattedData,
      nextCursor: formattedData[0]?.time
        ? (formattedData[0].time as number) * 1000
        : undefined,
    };
  } catch (error) {
    console.error(`Error fetching OHLCV for ${exchange}:`, error);
    return {
      data: [],
      nextCursor: undefined,
    };
  }
};

export const fetchRealtimeOHLCV = async ({
  ccxt,
  exchange,
  timeframe,
  symbol,
  lastCandleTime,
}: {
  ccxt?: CCXTType | null;
  exchange: ExchangeType;
  timeframe: TimeFrameType;
  symbol: string;
  lastCandleTime?: number;
}) => {
  if (!ccxt || !ccxt[exchange]) {
    throw new Error("Exchange instances not initialized");
  }

  const exchangeInstance = ccxt[exchange].pro;
  const now = Date.now();
  const timeframeMs = getTimeframeMilliseconds(timeframe);
  const since = lastCandleTime ? lastCandleTime * 1000 : now - timeframeMs * 2;
  const candleCount = lastCandleTime
    ? Math.ceil((now - lastCandleTime * 1000) / timeframeMs)
    : 2;

  try {
    const formattedTimeframe = getFormattedTimeframe(exchange, timeframe);
    const OHLCV = await exchangeInstance.fetchOHLCV(
      symbol,
      formattedTimeframe,
      since,
      candleCount,
      {
        ...(exchange === "binance" && { limit: candleCount }),
        ...(exchange === "bitget" && {
          endTime: now,
          limit: candleCount,
        }),
        ...(exchange === "bybit" && {
          limit: candleCount,
        }),
      },
    );

    if (!OHLCV || OHLCV.length === 0) {
      return [];
    }

    return OHLCV.map((candle) => ({
      time: (candle[0] as number) / 1000,
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
      volume: candle[5],
    })) as CandleData[];
  } catch (error) {
    console.error(`Error fetching realtime OHLCV for ${exchange}:`, error);
    return [];
  }
};
