import { useEffect, useRef } from "react";
import { ISeriesApi } from "lightweight-charts";
import { LoadingSpinner } from "../../loading";
import { useSearchParams } from "react-router";
import { Chart } from "./chart-wrapper";
import { CandleSeries } from "./candle";
import { useChartData } from "@/contexts/chart-data/use";
import { getStopLossMarkers } from "@/lib/chart";

export const ChartComponent = () => {
  const [searchParams] = useSearchParams();
  const { data, handleScroll } = useChartData();

  const timeframe = searchParams.get("timeframe")!;
  const exchange = searchParams.get("exchange")!;
  const symbol = searchParams.get("symbol")!;

  const candle = useRef<ISeriesApi<"Candlestick"> | null>(null);

  // 차트 데이터 업데이트
  useEffect(() => {
    if (!candle.current) return;
    candle.current.setData(data);
    console.log(data);
    console.log(candle.current.data());
    candle.current.setMarkers(getStopLossMarkers(data));
  }, [data]);

  return data.length > 0 ? (
    <Chart
      key={exchange + "-" + symbol + "-" + timeframe + "-chart"}
      onReachStart={handleScroll}
    >
      <CandleSeries ref={candle} data={data} />
    </Chart>
  ) : (
    <div className="w-full h-1/3 rounded-md overflow-hidden">
      <LoadingSpinner />
    </div>
  );
};
