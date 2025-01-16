import { ExchangeType } from "./useAccounts";
import { TimeFrameType } from "@/components/trade/time-frame";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useCCXT } from "./ccxt";
import { CandleData } from "@/components/chart/candle";
import { Exchange } from "ccxt";
import { useCallback, useEffect, useState } from "react";

export interface ExchangeInstances {
  [key: string]: {
    ccxt: Exchange;
    pro: Exchange;
  };
}

const getFormattedTimeframe = (
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
          return "1d"; // 일봉
        case "W":
          return "1w"; // 주봉
        case "M":
          return "1M"; // 월봉
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
          return "1d"; // 일봉
        case "W":
          return "1w"; // 주봉
        case "M":
          return "1M"; // 월봉
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
      return 24 * 60 * 60 * 1000; // 1일
    case "W":
      return 7 * 24 * 60 * 60 * 1000; // 1주
    case "M":
      return 30 * 24 * 60 * 60 * 1000; // 약 1달
    default:
      return parseInt(timeframe) * 60 * 1000; // 분 단위
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
      // 바이낸스는 최대 200일까지만 허용
      return Math.min(defaultRange, 200 * 24 * 60 * 60 * 1000);
    case "bitget":
      // bitget은 최대 90일까지만 허용
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
  ccxt?: ExchangeInstances;
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
          // 바이낸스의 경우 endTime도 추가
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

export const useHistoricalOHLCVData = (
  exchange: ExchangeType,
  symbol: string,
  timeframe: TimeFrameType,
) => {
  const { data: ccxt, isLoading: isCCXTLoading } = useCCXT();
  return useInfiniteQuery({
    queryKey: [exchange, symbol, timeframe, "historical"],
    initialPageParam: Date.now(),
    queryFn: async ({ pageParam }) =>
      await fetchHistoricalOHLCV({
        ccxt,
        exchange,
        pageParam,
        timeframe,
        symbol,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!ccxt && !isCCXTLoading,
  });
};

//realtime
export const fetchRealtimeOHLCV = async ({
  ccxt,
  exchange,
  timeframe,
  symbol,
}: {
  ccxt?: ExchangeInstances;
  exchange: ExchangeType;
  timeframe: TimeFrameType;
  symbol: string;
}) => {
  if (!ccxt || !ccxt[exchange]) {
    throw new Error("Exchange instances not initialized");
  }
  const exchangeInstance = ccxt[exchange].pro;
  const now = Date.now();
  const timeframeMs = getTimeframeMilliseconds(timeframe);
  const since = now - timeframeMs * 2;

  try {
    const formattedTimeframe = getFormattedTimeframe(exchange, timeframe);

    const OHLCV = await exchangeInstance.fetchOHLCV(
      symbol,
      formattedTimeframe,
      since,
      2,
      {
        // 거래소별 추가 옵션
        ...(exchange === "binance" && { limit: 2 }),
        ...(exchange === "bitget" && {
          endTime: now,
          limit: 2,
        }),
        ...(exchange === "bybit" && {
          limit: 2,
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
export const useRealtimeOHLCVData = (
  exchange: ExchangeType,
  symbol: string,
  timeframe: TimeFrameType,
) => {
  const { data: ccxt, isLoading: isCCXTLoading } = useCCXT();

  return useQuery({
    queryKey: [exchange, symbol, timeframe, "realtime"],
    queryFn: async () =>
      await fetchRealtimeOHLCV({ ccxt, exchange, timeframe, symbol }),
    enabled: !!ccxt && !isCCXTLoading,
    refetchInterval: 200,
    refetchIntervalInBackground: true,
    refetchOnMount: true,
  });
};

export const useChart = (
  exchange: ExchangeType,
  symbol: string,
  timeframe: TimeFrameType = "30",
) => {
  const [chartData, setChartData] = useState<CandleData[]>([]);
  const historicalOHLCVData = useHistoricalOHLCVData(
    exchange,
    symbol,
    timeframe,
  );
  const realtimeOHLCVData = useRealtimeOHLCVData(exchange, symbol, timeframe);

  // 데이터 통합 및 업데이트
  useEffect(() => {
    const historical =
      historicalOHLCVData.data?.pages.flatMap((page) => page.data) || [];
    const realtime = realtimeOHLCVData.data || [];

    // 데이터 병합 및 정렬을 한 번에 처리
    const merged = new Map();

    // 과거 데이터 추가
    historical.forEach((candle) => {
      merged.set(candle.time, candle);
    });

    // 실시간 데이터로 업데이트 (더 최신 데이터)
    realtime.forEach((candle) => {
      merged.set(candle.time, candle);
    });

    // 정렬된 배열로 변환
    const sortedData = Array.from(merged.values()).sort(
      (a, b) => (a.time as number) - (b.time as number),
    );

    setChartData(sortedData);
  }, [historicalOHLCVData.data, realtimeOHLCVData.data]);

  const handleScroll = useCallback(async () => {
    if (
      historicalOHLCVData.hasNextPage &&
      !historicalOHLCVData.isFetchingNextPage
    ) {
      try {
        await historicalOHLCVData.fetchNextPage();
      } catch (error) {
        console.error("Error fetching next page:", error);
      }
    }
  }, [
    historicalOHLCVData.hasNextPage,
    historicalOHLCVData.isFetchingNextPage,
    historicalOHLCVData.fetchNextPage,
  ]);
  return {
    data: chartData,
    isLoading: historicalOHLCVData.isLoading || realtimeOHLCVData.isLoading,
    fetchNextPage: historicalOHLCVData.fetchNextPage,
    hasNextPage: historicalOHLCVData.hasNextPage,
    isFetchingNextPage: historicalOHLCVData.isFetchingNextPage,
    handleScroll,
  };
};
