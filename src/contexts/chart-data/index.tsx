import { useCallback, useEffect, useState } from "react";
import { Time } from "lightweight-charts";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { ExchangeType } from "@/lib/accounts";
import { TimeFrameType } from "@/components/trade/time-frame";
import {
  fetchHistoricalOHLCV,
  fetchRealtimeOHLCV,
  getTimeframeMilliseconds,
} from "@/lib/chart";
import { useSearchParams } from "react-router";
import { CandleData } from "@/components/trade/chart-component/candle";
import { useCCXT } from "../ccxt/use";
import { ChartDataContext } from "./type";

export const ChartDataProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [searchParams] = useSearchParams();

  const timeframe = searchParams.get("timeframe")
    ? (searchParams.get("timeframe") as TimeFrameType)
    : "30";
  const exchange = searchParams.get("exchange")! as ExchangeType;
  const symbol = searchParams.get("symbol")!;
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

        const timeDiff =
          (nextCandle.time as number) - (currentCandle.time as number);
        const missingCandles = Math.floor(timeDiff / timeframeSeconds) - 1;

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

      filledData.push(data[data.length - 1]);
      return filledData;
    },
    [timeframeMs],
  );

  useEffect(() => {
    setChartData([]);
    setIsInitialized(false);
  }, [timeframe]);

  const ccxt = useCCXT();

  const historicalOHLCVData = useInfiniteQuery({
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

  const realtimeOHLCVData = useQuery({
    queryKey: [
      exchange,
      symbol,
      timeframe,
      "realtime",
      chartData.length > 0
        ? Number(chartData[chartData.length - 1].time)
        : undefined,
    ],
    queryFn: async () =>
      await fetchRealtimeOHLCV({
        ccxt,
        exchange,
        timeframe,
        symbol,
        lastCandleTime:
          chartData.length > 0
            ? Number(chartData[chartData.length - 1].time)
            : undefined,
      }),
    enabled: !!ccxt,
    refetchInterval: 200,
    refetchIntervalInBackground: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });

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

      if (realtime.length > 2) {
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

        const latestPage = result.data.pages[result.data.pages.length - 1];
        if (!latestPage?.data.length) return;

        setChartData((prevData) => {
          const newCandles = latestPage.data.filter((newCandle) => {
            return !prevData.some(
              (existingCandle) =>
                Number(existingCandle.time) === Number(newCandle.time),
            );
          });

          const merged = [...newCandles, ...prevData];
          return merged.sort((a, b) => Number(a.time) - Number(b.time));
        });
      } catch (error) {
        console.error("Error fetching next page:", error);
      }
    }
  }, [historicalOHLCVData]);

  const value = {
    data: chartData,
    isLoading: historicalOHLCVData.isLoading || realtimeOHLCVData.isLoading,
    hasNextPage: historicalOHLCVData.hasNextPage,
    isFetchingNextPage: historicalOHLCVData.isFetchingNextPage,
    handleScroll,
  };

  return (
    <ChartDataContext.Provider value={value}>
      {children}
    </ChartDataContext.Provider>
  );
};
