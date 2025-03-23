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
  const [isCompact, setIsCompact] = useState(false);
  const [bottomDistance, setBottomDistance] = useState<number>(0);
  const tradeComponentRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAvailableSpace = () => {
      setTimeout(() => {
        if (!tradeComponentRef.current || !positionRef.current) return;

        // TradeComponent의 bottom 위치
        const tradeBottom =
          tradeComponentRef.current.getBoundingClientRect().bottom;
        // 화면 전체 높이
        const viewportHeight = window.innerHeight;
        // 사용 가능한 공간
        const availableSpace = viewportHeight - tradeBottom;

        // 화면의 25%보다 작으면 compact 모드
        setIsCompact(availableSpace < viewportHeight * 0.25);

        // 초기 거리 계산 (포지션 컴포넌트 하단과 화면 하단 사이의 거리)
        const positionBottom =
          positionRef.current.getBoundingClientRect().bottom;
        setBottomDistance(viewportHeight - positionBottom);
      }, 100); // 약간의 지연을 줘서 정확한 위치 계산이 되도록 함
    };

    const observer = new ResizeObserver(() => {
      requestAnimationFrame(checkAvailableSpace);
    });
    if (tradeComponentRef.current) {
      observer.observe(tradeComponentRef.current);
    }
    window.addEventListener("resize", checkAvailableSpace);

    // 초기 체크 - 컴포넌트 마운트 후 약간의 지연을 주어 실행
    setTimeout(checkAvailableSpace, 100);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", checkAvailableSpace);
    };
  }, []);

  return (
    <ScreenWrapper
      className={["flex flex-col"]}
      headerProps={{
        ticker: {
          symbol: symbol ? symbol : undefined,
          percentage: tickerQuery.data?.percentage,
          isTickerLoading: tickerQuery.isLoading,
        },
        backButton: true,
      }}
    >
      {/* 헤더 및 제어 영역 */}
      <div className="flex-none space-y-1 h-lg:space-y-2 h-xl:space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-3">
          <PriceInfo />
          <div className="w-full flex items-center justify-between">
            <TimeFrame />
            <AccountSelector />
          </div>
        </div>
        <ChartComponent />
      </div>
      
      {/* 트레이딩 및 포지션 영역 - 화면이 넓을 경우 나란히 배치 */}
      <div className="flex flex-col lg:flex-row gap-2 flex-1 min-h-0">
        {/* 트레이딩 컴포넌트 */}
        <div ref={tradeComponentRef} className="lg:w-1/2 min-h-[200px]">
          <TradeComponent />
        </div>
        
        {/* 포지션 영역 */}
        <div
          ref={positionRef}
          className={cn(
            "mt-1 h-lg:mt-2 h-xl:mt-3 lg:mt-0 lg:w-1/2",
            isCompact &&
              "hover:transform hover:translate-y-[var(--bottom-distance)] transition-transform duration-300",
            isCompact
              ? "relative h-[50vh] bg-background z-10"
              : "flex-1 overflow-auto min-h-0",
          )}
          style={
            isCompact
              ? ({
                  "--bottom-distance": `${bottomDistance}px`,
                } as React.CSSProperties)
              : undefined
          }
        >
          <PositionComponent isCompact={isCompact} />
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
