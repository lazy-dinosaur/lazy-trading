import { TickerWithExchange } from "@/components/search/columns";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { ExchangeType } from "./useAccounts";
import { useExchange } from "./useExchange";
import { TimeFrameType } from "@/components/trade/time-frame";
import { CandleData } from "@/components/chart/candle";
import { useCallback, useEffect, useState } from "react";

const getHistoricalRange = (
  exchange: ExchangeType,
  timeFrame: TimeFrameType,
) => {
  const timeframeMs = getTimeframeMilliseconds(timeFrame);
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

const getTimeframeMilliseconds = (timeFrame: TimeFrameType) => {
  switch (timeFrame) {
    case "D":
      return 24 * 60 * 60 * 1000; // 1일
    case "W":
      return 7 * 24 * 60 * 60 * 1000; // 1주
    case "M":
      return 30 * 24 * 60 * 60 * 1000; // 약 1달
    default:
      return parseInt(timeFrame) * 60 * 1000; // 분 단위
  }
};

const getFormattedTimeframe = (
  exchange: ExchangeType,
  timeFrame: TimeFrameType,
) => {
  switch (exchange) {
    case "binance":
      switch (timeFrame) {
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
          return `${timeFrame}m`;
      }
    case "bybit":
      switch (timeFrame) {
        case "D":
          return "D";
        case "W":
          return "W";
        case "M":
          return "M";

        default:
          return timeFrame;
      }

    case "bitget":
      switch (timeFrame) {
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
          return `${timeFrame}m`;
      }
    default:
      return timeFrame;
  }
};

export const useChartData = ({
  timeFrame = "30",
}: {
  timeFrame?: TimeFrameType;
}) => {
  const params = useParams();
  const symbol = `${params.coin}/${params.base}`;
  const exchange = params.exchange as ExchangeType;
  const [chartData, setChartData] = useState<CandleData[]>([]);

  const {
    exchangeData: { data, isLoading },
  } = useExchange();

  // 기존 ticker 쿼리
  const fetchTicker = useQuery<TickerWithExchange>({
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
    refetchInterval: 500,
    refetchIntervalInBackground: true,
    refetchOnMount: true,
  });

  const fetchHistoricalOHLCV = useInfiniteQuery({
    queryKey: [exchange, symbol, timeFrame, "historical"],
    initialPageParam: Date.now(),
    queryFn: async ({ pageParam }) => {
      if (!data || !data[exchange]) {
        throw new Error("Exchange instances not initialized");
      }
      const exchangeInstance = data[exchange].pro;
      const until = pageParam as number;
      const range = getHistoricalRange(exchange, timeFrame);
      const since = until - range;

      try {
        const formattedTimeframe = getFormattedTimeframe(exchange, timeFrame);

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
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled:
      !!params.coin &&
      !!params.exchange &&
      !!params.base &&
      !!data &&
      !isLoading,
  });

  const fetchRealtimeOHLCV = useQuery({
    queryKey: [exchange, symbol, timeFrame, "realtime"],
    queryFn: async () => {
      if (!data || !data[exchange]) {
        throw new Error("Exchange instances not initialized");
      }
      const exchangeInstance = data[exchange].pro;
      const now = Date.now();
      const timeframeMs = getTimeframeMilliseconds(timeFrame);
      const since = now - timeframeMs * 2;

      try {
        const formattedTimeframe = getFormattedTimeframe(exchange, timeFrame);

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

  // 데이터 통합 및 업데이트
  useEffect(() => {
    const historical =
      fetchHistoricalOHLCV.data?.pages.flatMap((page) => page.data) || [];
    const realtime = fetchRealtimeOHLCV.data || [];

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
  }, [fetchHistoricalOHLCV.data, fetchRealtimeOHLCV.data]);

  // 스크롤 이벤트 핸들러를 useCallback으로 메모이제이션
  const handleScroll = useCallback(async () => {
    if (
      fetchHistoricalOHLCV.hasNextPage &&
      !fetchHistoricalOHLCV.isFetchingNextPage
    ) {
      try {
        await fetchHistoricalOHLCV.fetchNextPage();
      } catch (error) {
        console.error("Error fetching next page:", error);
      }
    }
  }, [
    fetchHistoricalOHLCV.hasNextPage,
    fetchHistoricalOHLCV.isFetchingNextPage,
    fetchHistoricalOHLCV.fetchNextPage,
  ]);

  return {
    fetchTicker,
    fetchChart: {
      data: chartData,
      isLoading: fetchHistoricalOHLCV.isLoading || fetchRealtimeOHLCV.isLoading,
      fetchNextPage: fetchHistoricalOHLCV.fetchNextPage,
      hasNextPage: fetchHistoricalOHLCV.hasNextPage,
      isFetchingNextPage: fetchHistoricalOHLCV.isFetchingNextPage,
      handleScroll,
    },
  };
};
