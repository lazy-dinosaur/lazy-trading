import { TickerWithExchange } from "@/components/search/columns";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { ExchangeType } from "./useAccounts";
import { useExchange } from "./useExchange";
import { TimeFrameType } from "@/components/trade/time-frame";
import { CandleData } from "@/components/chart/candle";
import { useCallback, useEffect, useState } from "react";
import {
  fetchHistoricalOHLCV,
  fetchRealtimeOHLCV,
  fetchTicker,
} from "@/lib/ccxtUtils";

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
    exchangeData: { data: exchangeData, isLoading },
  } = useExchange();

  // 기존 ticker 쿼리
  const tickerData = useQuery<TickerWithExchange>({
    queryKey: [exchange, params.coin, params.base],
    queryFn: async () => await fetchTicker({ exchangeData, exchange, symbol }),
    enabled:
      !!params.coin &&
      !!params.exchange &&
      !!params.base &&
      !!exchangeData &&
      !isLoading,
    refetchInterval: 500,
    refetchIntervalInBackground: true,
    refetchOnMount: true,
  });

  const historicalOHLCVData = useInfiniteQuery({
    queryKey: [exchange, symbol, timeFrame, "historical"],
    initialPageParam: Date.now(),
    queryFn: async ({ pageParam }) =>
      await fetchHistoricalOHLCV({
        exchangeData: exchangeData,
        exchange,
        pageParam,
        timeFrame,
        symbol,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled:
      !!params.coin &&
      !!params.exchange &&
      !!params.base &&
      !!exchangeData &&
      !isLoading,
  });

  const realtimeOHLCVData = useQuery({
    queryKey: [exchange, symbol, timeFrame, "realtime"],
    queryFn: async () =>
      await fetchRealtimeOHLCV({ exchangeData, exchange, timeFrame, symbol }),
    enabled:
      !!params.coin &&
      !!params.exchange &&
      !!params.base &&
      !!exchangeData &&
      !isLoading,
    refetchInterval: 200,
    refetchIntervalInBackground: true,
    refetchOnMount: true,
  });

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

  // 스크롤 이벤트 핸들러를 useCallback으로 메모이제이션
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
    tickerData,
    fetchChart: {
      data: chartData,
      isLoading: historicalOHLCVData.isLoading || realtimeOHLCVData.isLoading,
      fetchNextPage: historicalOHLCVData.fetchNextPage,
      hasNextPage: historicalOHLCVData.hasNextPage,
      isFetchingNextPage: historicalOHLCVData.isFetchingNextPage,
      handleScroll,
    },
  };
};
