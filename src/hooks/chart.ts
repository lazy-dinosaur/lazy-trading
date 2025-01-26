import { TimeFrameType } from "@/components/trade/time-frame";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { Exchange } from "ccxt";
import { useCallback, useEffect, useState } from "react";
import { Time } from "lightweight-charts";
import { CCXTType, useCCXT } from "./use-ccxt-context";
import { ExchangeType } from "@/lib/accounts";
import { CandleData } from "@/components/chart/candle-types";

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
  const ccxt = useCCXT();
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
    enabled: !!ccxt,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });
};

//realtime
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

  // 마지막 캔들 시간이 있으면 그 시점부터, 없으면 최근 2개 캔들만
  const since = lastCandleTime ? lastCandleTime * 1000 : now - timeframeMs * 2;

  // 누락된 캔들 개수 계산
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
        // 거래소별 추가 옵션
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
export const useRealtimeOHLCVData = (
  exchange: ExchangeType,
  symbol: string,
  timeframe: TimeFrameType,
  lastCandleTime?: number,
) => {
  const ccxt = useCCXT();

  return useQuery({
    queryKey: [exchange, symbol, timeframe, "realtime", lastCandleTime],
    queryFn: async () =>
      await fetchRealtimeOHLCV({
        ccxt,
        exchange,
        timeframe,
        symbol,
        lastCandleTime,
      }),
    enabled: !!ccxt,
    refetchInterval: 200,
    refetchIntervalInBackground: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });
};

export const useChartData = (
  exchange: ExchangeType,
  symbol: string,
  timeframe: TimeFrameType = "30",
) => {
  const [chartData, setChartData] = useState<CandleData[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const timeframeMs = getTimeframeMilliseconds(timeframe);

  const validateAndFillGaps = useCallback(
    (data: CandleData[]) => {
      if (data.length < 2) return data;

      const filledData: CandleData[] = [];
      const timeframeSeconds = timeframeMs / 1000;

      for (let i = 0; i < data.length - 1; i++) {
        const currentCandle = data[i];
        const nextCandle = data[i + 1];
        filledData.push(currentCandle);

        // 현재 캔들과 다음 캔들 사이의 시간 차이 계산
        const timeDiff =
          (nextCandle.time as number) - (currentCandle.time as number);
        const missingCandles = Math.floor(timeDiff / timeframeSeconds) - 1;

        // 갭이 있는 경우 채우기
        if (missingCandles > 0) {
          for (let j = 1; j <= missingCandles; j++) {
            const missingTime =
              (currentCandle.time as number) + timeframeSeconds * j;
            filledData.push({
              time: missingTime as Time,
              open: currentCandle.close,
              high: currentCandle.close,
              low: currentCandle.close,
              close: currentCandle.close,
              volume: 0,
            });
          }
        }
      }

      // 마지막 캔들 추가
      filledData.push(data[data.length - 1]);
      return filledData;
    },
    [timeframeMs],
  );

  // timeframe이 변경될 때마다 차트 데이터와 초기화 상태를 리셋
  useEffect(() => {
    setChartData([]);
    setIsInitialized(false);
  }, [timeframe]);

  const historicalOHLCVData = useHistoricalOHLCVData(
    exchange,
    symbol,
    timeframe,
  );
  const realtimeOHLCVData = useRealtimeOHLCVData(
    exchange,
    symbol,
    timeframe,
    chartData.length > 0
      ? Number(chartData[chartData.length - 1].time)
      : undefined,
  );

  // 초기 히스토리컬 데이터 로드
  useEffect(() => {
    if (!isInitialized && historicalOHLCVData.data) {
      const historical = historicalOHLCVData.data.pages.flatMap(
        (page) => page.data,
      );
      if (historical.length > 0) {
        const sortedData = historical.sort(
          (a, b) => (a.time as number) - (b.time as number),
        );
        const filledData = validateAndFillGaps(sortedData);
        setChartData(filledData);
        setIsInitialized(true);
      }
    }
  }, [historicalOHLCVData.data, isInitialized, timeframe, validateAndFillGaps]);

  // 실시간 데이터 업데이트
  useEffect(() => {
    if (!isInitialized || !realtimeOHLCVData.data?.length) return;

    const realtime = realtimeOHLCVData.data;
    const lastRealtimeCandle = realtime[realtime.length - 1];
    const secondLastRealtimeCandle = realtime[realtime.length - 2];

    setChartData((prevData) => {
      const newData = [...prevData];
      const lastIndex = newData.length - 1;
      if (lastIndex < 0) return newData;

      const lastCandle = newData[lastIndex];
      const lastCandleTime = lastCandle.time as number;
      const realtimeCandleTime = lastRealtimeCandle.time as number;

      // 갭이 있는 경우 새로운 데이터로 업데이트
      if (realtime.length > 2) {
        // 중간에 누락된 캔들들이 포함된 데이터
        realtime.slice(0, -1).forEach((candle) => {
          const candleTime = Number(candle.time);
          const existingIndex = newData.findIndex(
            (existing) => Number(existing.time) === candleTime,
          );

          if (existingIndex !== -1) {
            newData[existingIndex] = candle;
          } else if (candleTime > lastCandleTime) {
            newData.push(candle);
          }
        });
      }

      // 실시간 데이터 업데이트

      // 실시간 데이터 업데이트
      if (lastCandleTime === realtimeCandleTime) {
        newData[lastIndex] = lastRealtimeCandle;
      } else if (
        lastCandleTime === (secondLastRealtimeCandle?.time as number)
      ) {
        newData[lastIndex] = secondLastRealtimeCandle;
        newData.push(lastRealtimeCandle);
      } else if (realtimeCandleTime > lastCandleTime) {
        newData.push(lastRealtimeCandle);
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

        // 새로운 데이터만 추출
        const latestPage = result.data.pages[result.data.pages.length - 1];
        if (!latestPage?.data.length) return;

        setChartData((prevData) => {
          // 새 데이터에서 중복을 제거
          const newCandles = latestPage.data.filter((newCandle) => {
            return !prevData.some(
              (existingCandle) =>
                Number(existingCandle.time) === Number(newCandle.time),
            );
          });

          // 기존 데이터와 새 데이터 병합
          const merged = [...newCandles, ...prevData];

          // 시간순 정렬
          return merged.sort((a, b) => Number(a.time) - Number(b.time));
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

export const fetchTradingFees = async (
  ccxt: ExchangeInstances,
  exchange: ExchangeType,
  symbol: string,
) => {
  if (!ccxt?.[exchange]) {
    throw new Error("Exchange instance not initialized");
  }

  try {
    const exchangeInstance = ccxt[exchange].pro;

    // 거래소별 수수료 정보 가져오기
    const fees = await exchangeInstance.fetchTradingFee(symbol);

    return {
      maker: fees.maker, // 메이커 수수료
      taker: fees.taker, // 테이커 수수료
    };
  } catch (error) {
    console.error(`Error fetching fees for ${exchange}:`, error);

    try {
      const exchangeInstance = ccxt[exchange].pro;

      // 마켓 정보 로드 (수수료 포함)
      const market = exchangeInstance.market(symbol);

      return {
        // 기본 수수료 정보
        maker: market.maker,
        taker: market.taker,
        limits: market.limits,
        precision: market.precision,
      };
    } catch (error) {
      console.error(`Error fetching market info for ${exchange}:`, error);
      return null;
    }
  }
};

export const useTradingFees = (exchange: ExchangeType, symbol: string) => {
  const ccxt = useCCXT();

  return useQuery({
    queryKey: [exchange, symbol, "fees"],
    queryFn: async () => await fetchTradingFees(ccxt!, exchange, symbol),
    enabled: !!ccxt,
  });
};
