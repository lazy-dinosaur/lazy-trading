import { ExchangeType } from "@/lib/accounts";
import { TimeFrameType } from "@/components/trade/time-frame";
import { CandleData } from "@/components/trade/chart-component/candle";
import { CCXTType } from "@/contexts/ccxt/type";

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

/**
 * 최근 캔들 데이터에서 손절 기준이 되는 고점/저점을 찾는 함수
 * @param data - 캔들 데이터 배열
 * @param arrLen - 현재 검색할 배열의 길이
 * @param tradeType - 'high' 또는 'low'
 * @returns 손절 기준이 되는 캔들 데이터
 */
export const searchingStopLossCandle = (
  data: CandleData[],
  arrLen: number,
  tradeType: "high" | "low",
): CandleData => {
  // 최근 3개의 캔들 값을 저장할 배열
  const candles: number[] = [];

  // 최근 3개의 캔들에서 고점 또는 저점 값을 수집
  for (let i = 0; i < 3; i++) {
    if (arrLen - i >= 0 && data[arrLen - i]) {
      candles.push(data[arrLen - i][tradeType]);
    }
  }

  // 배열이 비어있으면 마지막 캔들 반환
  if (candles.length === 0) {
    return data[data.length - 1];
  }

  // 고점/저점의 인덱스 찾기
  let extremeIndex: number;
  if (tradeType === "low") {
    // 저점인 경우 최소값의 인덱스
    extremeIndex = candles.indexOf(Math.min(...candles));
  } else {
    // 고점인 경우 최대값의 인덱스
    extremeIndex = candles.indexOf(Math.max(...candles));
  }

  // 현재 구간의 첫 번째 캔들이 고점/저점인 경우
  if (extremeIndex === 0) {
    // 해당 값을 가진 캔들들 중 가장 최근 캔들 찾기
    const matchingCandles = data.filter(
      (candle) => candle[tradeType] === candles[extremeIndex],
    );
    return matchingCandles[matchingCandles.length - 1];
  }

  // 고점/저점이 첫 번째 캔들이 아닌 경우 재귀적으로 이전 구간 검색
  return searchingStopLossCandle(data, arrLen - extremeIndex, tradeType);
};

/**
 * 차트에 표시할 마커 데이터 생성
 */
export const getStopLossMarkers = (data: CandleData[]) => {
  if (data.length < 3) return [];

  const highMarker = searchingStopLossCandle(data, data.length - 1, "high");
  const lowMarker = searchingStopLossCandle(data, data.length - 1, "low");

  return [
    {
      time: highMarker.time,
      position: "aboveBar" as const,
      color: "#ef4444",
      shape: "arrowDown" as const,
      text: `High: ${highMarker.high.toFixed(2)}`,
    },
    {
      time: lowMarker.time,
      position: "belowBar" as const,
      color: "#22c55e",
      shape: "arrowUp" as const,
      text: `Low: ${lowMarker.low.toFixed(2)}`,
    },
  ];
};
