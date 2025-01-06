import { useEffect, useRef } from "react";
import { ISeriesApi } from "lightweight-charts";
import { CandleSeries } from "../chart/candle";
import { Chart } from "../chart/chart";
import { TickerWithExchange } from "../search/columns";
import { TimeFrameType } from "./time-frame";
import { useChartData } from "@/hooks/useChartData";

// 테스트 데이터

//TODO: 데이터 정제

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
  }, [fetchChart.data]);

  return (
    <Chart key={chartKey} onReachStart={fetchChart.handleScroll}>
      <CandleSeries ref={candle} data={fetchChart.data} />
    </Chart>
  );
};
