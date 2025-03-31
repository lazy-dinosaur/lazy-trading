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

const TradeInContexts = () => {
  const { tickerQuery } = useTrade();
  const [searchParams] = useSearchParams();
  const symbol = searchParams.get("symbol")!;
  const [screenLayout, setScreenLayout] = useState<"desktop" | "mobile">(
    "desktop",
  );
  const [chartSize, setChartSize] = useState<"normal" | "compact">("normal");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkScreenSize = () => {
      const isDesktop = window.innerWidth >= 1024; // lg breakpoint
      setScreenLayout(isDesktop ? "desktop" : "mobile");
    };

    // 화면 크기에 따라 레이아웃 설정
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    // 화면 높이에 따라 차트 크기 조정
    const checkChartSize = () => {
      setChartSize(window.innerHeight < 800 ? "compact" : "normal");
    };
    checkChartSize();
    window.addEventListener("resize", checkChartSize);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
      window.removeEventListener("resize", checkChartSize);
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
      <div className="flex-none space-y-1 h-lg:space-y-2 h-xl:space-y-3 sticky top-0 z-10 bg-background pb-2 border-b">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-3">
          <PriceInfo />
          <div className="w-full flex items-center justify-between">
            <TimeFrame />
            <AccountSelector />
          </div>
        </div>
      </div>

      {/* 스크롤 가능한 컨텐츠 영역 */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-background"
      >
        <div className="mb-8">
          {/* 하단에 여유 공간 추가 */}
          {/* 차트 영역 - 높이 증가 */}
          <div
            className={cn(
              "w-full py-2",
              chartSize === "compact" ? "mb-1" : "mb-2",
            )}
          >
            <ChartComponent height={400} />
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
