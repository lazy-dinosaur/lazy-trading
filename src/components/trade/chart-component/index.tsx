import { useEffect, useRef } from "react";
import { ISeriesApi } from "lightweight-charts";
import { useSearchParams } from "react-router";
import { Chart } from "./chart-wrapper";
import { CandleSeries } from "./candle";
import { useChartData } from "@/contexts/chart-data/use";
import { getStopLossMarkers } from "@/lib/chart";
import { ExchangeType } from "@/lib/accounts";
import { useTrade } from "@/contexts/trade/use";
import { ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";

interface ChartComponentProps {
  height?: number; // 차트 높이 설정을 위한 prop 추가
}

export const ChartComponent = ({ height = 400 }: ChartComponentProps) => {
  const [searchParams] = useSearchParams();
  const { data, handleScroll, chartformat, isLoading } = useChartData();
  const { tradeInfo } = useTrade();

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

  return (
    <div
      className="relative w-full border rounded-md overflow-hidden"
      style={height ? { height: `${height}px` } : undefined}
    >
      {/* 비용 및 이익 표시 오버레이 */}
      {tradeInfo && data.length > 0 && (
        <div className="absolute top-2 right-2 z-10 bg-background/80 backdrop-blur-sm p-2 rounded-md border flex flex-col text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-green-500">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span className="font-medium">Long:</span>
            <div className="flex gap-1">
              <span>TP: {tradeInfo.long.target.formatted}</span>
              <span>|</span>
              <span>SL: {tradeInfo.long.stoploss.formatted}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-red-500">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span className="font-medium">Short:</span>
            <div className="flex gap-1">
              <span>TP: {tradeInfo.short.target.formatted}</span>
              <span>|</span>
              <span>SL: {tradeInfo.short.stoploss.formatted}</span>
            </div>
          </div>
        </div>
      )}

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
        <div className={`w-full flex items-center justify-center ${height ? '' : 'h-[40vh] h-lg:h-[35vh] h-xl:h-[30vh]'}`} style={height ? { height: `${height}px` } : undefined}>
          {isLoading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">로딩 중...</span>
            </div>
          ) : (
            <div className="text-center p-4">
              <div className="text-lg font-medium mb-1">차트 데이터가 없습니다</div>
              <div className="text-sm text-muted-foreground">다른 시간대나 심볼을 선택해 보세요</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
