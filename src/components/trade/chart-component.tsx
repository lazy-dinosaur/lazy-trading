import { useEffect, useRef } from "react";
import { ISeriesApi } from "lightweight-charts";
import { Chart } from "../chart/chart";
import { LoadingSpinner } from "../loading";
import { getStopLossMarkers } from "@/lib/ccxt";
import { CandleSeries } from "../chart/candle";
import { CandleData } from "../chart/candle-types";
import { useSearchParams } from "react-router";

export const ChartComponent = ({
  candleData,
  handleChartScroll,
}: {
  candleData: CandleData[];
  handleChartScroll: () => Promise<void>;
}) => {
  const [searchParams] = useSearchParams();

  const timeframe = searchParams.get("timeframe")!;
  const exchange = searchParams.get("exchange")!;
  const symbol = searchParams.get("symbol")!;

  const candle = useRef<ISeriesApi<"Candlestick"> | null>(null);

  // 차트 데이터 업데이트
  useEffect(() => {
    if (!candle.current) return;
    candle.current.setData(candleData);
    console.log(candleData);
    console.log(candle.current.data());
    candle.current.setMarkers(getStopLossMarkers(candleData));
  }, [candleData]);

  return candleData.length > 0 ? (
    <Chart
      key={exchange + "-" + symbol + "-" + timeframe + "-chart"}
      onReachStart={handleChartScroll}
    >
      <CandleSeries ref={candle} data={candleData} />
    </Chart>
  ) : (
    <div className="w-full h-1/3 rounded-md overflow-hidden">
      <LoadingSpinner />
    </div>
  );
};
