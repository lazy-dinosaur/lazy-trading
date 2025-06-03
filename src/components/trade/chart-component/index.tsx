import { useEffect, useRef } from "react";
import { ISeriesApi } from "lightweight-charts";
import { useSearchParams } from "react-router";
import { Chart } from "./chart-wrapper";
import { CandleSeries } from "./candle";
import { useChartData } from "@/contexts/chart-data/use";
// import { getStopLossMarkers } from "@/lib/chart"; // 사용되지 않으므로 제거
import { ExchangeType } from "@/lib/accounts";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ChartComponentProps {
  height?: number; // 차트 높이 설정을 위한 prop 추가
}

export const ChartComponent = ({ height = 400 }: ChartComponentProps) => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { data, handleScroll, chartformat, isLoading } = useChartData();

  const timeframe = searchParams.get("timeframe")!;
  const exchange = searchParams.get("exchange")! as ExchangeType;
  const symbol = searchParams.get("symbol")!;

  const candle = useRef<ISeriesApi<"Candlestick"> | null>(null);

  // 차트 데이터 업데이트
  useEffect(() => {
    if (!candle.current) return;
    candle.current.setData(data);
    // 스탑로스 마커 설정 로직은 CandleSeries 내부로 이동했으므로 여기서는 제거
    // candle.current.setMarkers(getStopLossMarkers(data));
    candle.current.applyOptions({
      priceFormat: {
        type: "price",
        ...chartformat,
      },
    });
  }, [data, chartformat]);

  return (
    <div
      className="relative w-full border rounded-md overflow-hidden h-[35vh]"
    // style={height ? { height: `${height}px` } : undefined}
    >

      {/* 차트 렌더링 */}
      {data.length > 0 ? (
        <Chart
          key={exchange + "-" + symbol + "-" + timeframe + "-chart"}
          onReachStart={handleScroll}
          customHeight={height ? `${height}px` : undefined}
        >
          <CandleSeries ref={candle} data={data} />
        </Chart>
      ) : (
        <div
          className={`w-full flex items-center justify-center ${height ? "" : "h-[40vh] h-lg:h-[35vh] h-xl:h-[30vh]"}`}
          style={height ? { height: `${height}px` } : undefined}
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">{t('common.loading')}</span>
            </div>
          ) : (
            <div className="text-center p-4">
              <div className="text-lg font-medium mb-1">
                {t('chart.no_data')}
              </div>
              <div className="text-sm text-muted-foreground">
                {t('chart.try_different')}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
