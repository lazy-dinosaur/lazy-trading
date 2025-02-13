import { useEffect, useRef } from "react";
import { ISeriesApi } from "lightweight-charts";
import { LoadingSpinner } from "../../loading";
import { useSearchParams } from "react-router";
import { Chart } from "./chart-wrapper";
import { CandleSeries } from "./candle";
import { useChartData } from "@/contexts/chart-data/use";
import { getStopLossMarkers } from "@/lib/chart";
import { ExchangeType } from "@/lib/accounts";

export const ChartComponent = () => {
  const [searchParams] = useSearchParams();
  const { data, handleScroll, chartformat } = useChartData();

  const timeframe = searchParams.get("timeframe")!;
  const exchange = searchParams.get("exchange")! as ExchangeType;
  const symbol = searchParams.get("symbol")!;

  const candle = useRef<ISeriesApi<"Candlestick"> | null>(null);

  // 차트 데이터 업데이트
  useEffect(() => {
    if (!candle.current) return;
    candle.current.setData(data);
    candle.current.setMarkers(getStopLossMarkers(data));
    candle.current.applyOptions({
      priceFormat: {
        type: "price",
        ...chartformat,
      },
    });
  }, [data, chartformat]);

  return data.length > 0 ? (
    <Chart
      key={exchange + "-" + symbol + "-" + timeframe + "-chart"}
      onReachStart={handleScroll}
    >
      <CandleSeries ref={candle} data={data} />
    </Chart>
  ) : (
    <div className="w-full h-[40vh] h-lg:h-[35vh] h-xl:h-[30vh] rounded-md overflow-hidden">
      {/* <div className="w-full h-[30vh] rounded-md overflow-hidden"> */}
      <LoadingSpinner />
    </div>
  );
};
