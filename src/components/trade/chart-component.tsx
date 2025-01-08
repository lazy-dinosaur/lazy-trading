import { useEffect, useRef } from "react";
import { ISeriesApi } from "lightweight-charts";
import { CandleSeries } from "../chart/candle";
import { Chart } from "../chart/chart";
import { TickerWithExchange } from "../search/columns";
import { TimeFrameType } from "./time-frame";
import { useChartData } from "@/hooks/useChartData";
import { LoadingSpinner } from "../loading";
import { getStopLossMarkers } from "@/lib/utils";

export const ChartComponent = ({
  timeFrame,
  tickerData,
}: {
  timeFrame: TimeFrameType;
  tickerData: TickerWithExchange;
}) => {
  const candle = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const chartKey = `${tickerData.exchange}-${tickerData.symbol}-${timeFrame}`;

  const { fetchChart } = useChartData({ timeFrame });

  // 차트 데이터 업데이트
  useEffect(() => {
    if (!candle.current) return;
    candle.current.setData(fetchChart.data);
    candle.current.setMarkers(getStopLossMarkers(fetchChart.data));
  }, [fetchChart.data]);

  return fetchChart.data.length > 0 ? (
    <Chart key={chartKey} onReachStart={fetchChart.handleScroll}>
      <CandleSeries ref={candle} data={fetchChart.data} />
    </Chart>
  ) : (
    <div className="w-full h-72 rounded-md overflow-hidden">
      <LoadingSpinner />
    </div>
  );
};
