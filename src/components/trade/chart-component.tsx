import { useEffect, useRef } from "react";
import { ISeriesApi } from "lightweight-charts";
import { CandleData, CandleSeries } from "../chart/candle";
import { Chart } from "../chart/chart";
import { LoadingSpinner } from "../loading";
import { getStopLossMarkers } from "@/lib/ccxtUtils";

export const ChartComponent = ({
  candleData,
  handleChartScroll,
  chartKey,
}: {
  candleData: CandleData[];
  handleChartScroll: () => Promise<void>;
  chartKey: string;
}) => {
  const candle = useRef<ISeriesApi<"Candlestick"> | null>(null);

  // 차트 데이터 업데이트
  useEffect(() => {
    if (!candle.current) return;
    candle.current.setData(candleData);
    candle.current.setMarkers(getStopLossMarkers(candleData));
  }, [candleData]);

  return candleData.length > 0 ? (
    <Chart key={chartKey} onReachStart={handleChartScroll}>
      <CandleSeries ref={candle} data={candleData} />
    </Chart>
  ) : (
    <div className="w-full h-1/3 rounded-md overflow-hidden">
      <LoadingSpinner />
    </div>
  );
};
