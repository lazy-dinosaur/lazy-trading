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
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });
};

export const useChart = (
  exchange: ExchangeType,
  symbol: string,
  timeframe: TimeFrameType = "30",
) => {
  const [chartData, setChartData] = useState<CandleData[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const historicalOHLCVData = useHistoricalOHLCVData(
    exchange,
    symbol,
    timeframe,
  );
  const realtimeOHLCVData = useRealtimeOHLCVData(exchange, symbol, timeframe);

  // 초기 히스토리컬 데이터 로드
  useEffect(() => {
    if (!isInitialized && historicalOHLCVData.data) {
      const historical = historicalOHLCVData.data.pages.flatMap(
        (page) => page.data,
      );
      if (historical.length > 0) {
        setChartData(historical);
        setIsInitialized(true);
      }
    }
  }, [historicalOHLCVData.data, isInitialized]);

  // 실시간 데이터 업데이트
  useEffect(() => {
    if (!isInitialized || !realtimeOHLCVData.data?.length) return;

    const realtime = realtimeOHLCVData.data;
    const lastRealtimeCandle = realtime[realtime.length - 1];
    const secondLastRealtimeCandle = realtime[realtime.length - 2];

    setChartData((prevData) => {
      const newData = [...prevData];

      // 마지막 캔들 업데이트 또는 새 캔들 추가
      const lastIndex = newData.length - 1;
      if (lastIndex >= 0) {
        const lastCandle = newData[lastIndex];

        if (lastCandle.time === lastRealtimeCandle.time) {
          // 현재 진행 중인 캔들 업데이트
          newData[lastIndex] = lastRealtimeCandle;
        } else if (lastCandle.time === secondLastRealtimeCandle?.time) {
          // 이전 캔들 업데이트 및 새 캔들 추가
          newData[lastIndex] = secondLastRealtimeCandle;
          newData.push(lastRealtimeCandle);
        } else if (lastRealtimeCandle.time > lastCandle.time) {
          // 새로운 캔들 추가
          newData.push(lastRealtimeCandle);
        }
      }

      return newData;
    });
  }, [realtimeOHLCVData.data, isInitialized]);

  const handleScroll = useCallback(async () => {
    if (
      historicalOHLCVData.hasNextPage &&
      !historicalOHLCVData.isFetchingNextPage
    ) {
      try {
        const result = await historicalOHLCVData.fetchNextPage();
        if (!result.data) return;

        const newData = result.data.pages.flatMap((page) => page.data);

        setChartData((prevData) => {
          const merged = [...newData, ...prevData];
          return merged.sort((a, b) => (a.time as number) - (b.time as number));
        });
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
