import { useEffect, useRef, useState } from "react";
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

export const ChartComponent = ({ height }: ChartComponentProps) => {
  const [searchParams] = useSearchParams();
  const { data, handleScroll, chartformat, isLoading } = useChartData();
  const { tradeInfo } = useTrade();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const timeframe = searchParams.get("timeframe")!;
  const exchange = searchParams.get("exchange")! as ExchangeType;
  const symbol = searchParams.get("symbol")!;

  const candle = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

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

  // 전체 화면 토글 핸들러
  const toggleFullscreen = () => {
    if (!document.fullscreenElement && chartContainerRef.current) {
      chartContainerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // 전체 화면 변경 이벤트 리스너
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div 
      ref={chartContainerRef} 
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
      
      {/* 전체 화면 버튼 */}
      <button 
        onClick={toggleFullscreen}
        className="absolute left-2 top-2 z-10 bg-background/80 backdrop-blur-sm p-1.5 rounded-md border hover:bg-accent/80 transition-colors"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          {isFullscreen ? (
            <>
              <path d="M8 3v4a1 1 0 0 1-1 1H3"></path>
              <path d="M21 8h-4a1 1 0 0 1-1-1V3"></path>
              <path d="M3 16h4a1 1 0 0 1 1 1v4"></path>
              <path d="M16 21v-4a1 1 0 0 1 1-1h4"></path>
            </>
          ) : (
            <>
              <polyline points="15 3 21 3 21 9"></polyline>
              <polyline points="9 21 3 21 3 15"></polyline>
              <line x1="21" y1="3" x2="14" y2="10"></line>
              <line x1="3" y1="21" x2="10" y2="14"></line>
            </>
          )}
        </svg>
      </button>

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
