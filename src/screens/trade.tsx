import { AccountSelector } from "@/components/trade/account-select";
import { TimeFrame } from "@/components/trade/time-frame";
import { ScreenWrapper } from "@/components/screen-wrapper";
import { PriceInfo } from "@/components/trade/price-info";
import { useTrade } from "@/contexts/trade/use";
import { useSearchParams } from "react-router";
import { ChartComponent } from "@/components/trade/chart-component";
import { ChartDataProvider } from "@/contexts/chart-data";
import { TradeProvider } from "@/contexts/trade";
import { PositionComponent } from "@/components/trade/position-component";
import { TradeComponent } from "@/components/trade/trade-component";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { BREAKPOINTS } from "@/lib/constants";

const TradeInContexts = () => {
  const { tickerQuery } = useTrade();
  const [searchParams] = useSearchParams();
  const symbol = searchParams.get("symbol")!;
  const [screenLayout, setScreenLayout] = useState<"desktop" | "mobile">(
    "desktop",
  );
  const [chartSize, setChartSize] = useState<"normal" | "compact">("normal");
  const [chartHeight, setChartHeight] = useState(400); // 기본 높이는 400px
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateLayout = () => {
      // 레이아웃 타입 설정 (데스크탑/모바일)
      const isDesktop = window.innerWidth >= BREAKPOINTS.TABLET;
      setScreenLayout(isDesktop ? "desktop" : "mobile");

      // 차트 컴팩트 모드 설정 (화면 높이에 따라)
      const isCompact = window.innerHeight < BREAKPOINTS.HEIGHT_LARGE;
      setChartSize(isCompact ? "compact" : "normal");

      // 차트 높이 동적 설정 (화면 너비에 따라) - 더 큰 값으로 증가
      if (window.innerWidth >= BREAKPOINTS.DESKTOP) {
        // 데스크탑 대형 화면
        setChartHeight(650);
      } else if (window.innerWidth >= BREAKPOINTS.TABLET) {
        // 데스크탑 중형 화면
        setChartHeight(550);
      } else if (window.innerWidth >= BREAKPOINTS.MOBILE) {
        // 태블릿
        setChartHeight(500);
      } else {
        // 모바일
        setChartHeight(450);
      }
    };

    // 초기 레이아웃 설정
    updateLayout();

    // 리사이즈 이벤트에 대한 단일 핸들러
    window.addEventListener("resize", updateLayout);

    return () => {
      window.removeEventListener("resize", updateLayout);
    };
  }, []);

  return (
    <ScreenWrapper
      className={["flex flex-col h-full"]}
      headerProps={{
        ticker: {
          symbol: symbol ? symbol : undefined,
          percentage: tickerQuery.data?.percentage,
          isTickerLoading: tickerQuery.isLoading,
        },
        backButton: true,
      }}
    >
      {/* 헤더 및 제어 영역 - 고정 */}
      <div className="flex-none sticky top-0 z-10 bg-background pb-1.5 border-b">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 md:gap-2">
          <PriceInfo />
          <div className="w-full flex items-center justify-between space-x-2">
            <TimeFrame />
            <AccountSelector />
          </div>
        </div>
      </div>

      {/* 스크롤 가능한 컨텐츠 영역 */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-background mb-10"
      >
        {/* 하단에 여유 공간 추가 */}
        {/* 차트 영역 - 높이 증가 */}
        <div
          className={cn(
            "w-full py-2",
            chartSize === "compact" ? "mb-1" : "mb-2",
          )}
        >
          <ChartComponent height={chartHeight} />
        </div>
        {/* 트레이딩 및 포지션 영역 */}
        <div
          className={cn(
            "gap-2",
            screenLayout === "desktop" ? "flex flex-row" : "flex flex-col",
          )}
        >
          {/* 트레이딩 컴포넌트 */}
          <div
            className={cn(
              screenLayout === "desktop" ? "w-1/2" : "w-full",
              "min-h-[200px]",
            )}
          >
            <TradeComponent />
          </div>

          {/* 포지션 영역 */}
          <div
            className={cn(
              screenLayout === "desktop" ? "w-1/2" : "w-full",
              "min-h-[300px] border rounded-md my-2",
            )}
          >
            <PositionComponent />
          </div>
        </div>
      </div>
    </ScreenWrapper>
  );
};

const Trade = () => {
  return (
    <ChartDataProvider>
      <TradeProvider>
        <TradeInContexts />
      </TradeProvider>
    </ChartDataProvider>
  );
};
export default Trade;
