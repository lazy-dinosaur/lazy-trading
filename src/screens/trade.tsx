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
import { useEffect, useState } from "react";

const TradeInContexts = () => {
  const { tickerQuery } = useTrade();
  const [searchParams] = useSearchParams();
  const symbol = searchParams.get("symbol")!;
  const [isCompact, setIsCompact] = useState(false);

  // 포지션 컴포넌트의 높이를 체크하는 함수
  useEffect(() => {
    const checkHeight = () => {
      const vh = window.innerHeight * 0.2; // 20vh
      const positionElement = document.getElementById("position-component");
      if (positionElement) {
        const isSmall = positionElement.scrollHeight < vh;
        setIsCompact(isSmall);
      }
    };

    // 초기 체크
    checkHeight();

    // ResizeObserver를 사용하여 컴포넌트 크기 변화 감지
    const observer = new ResizeObserver(checkHeight);
    const positionElement = document.getElementById("position-component");
    if (positionElement) {
      observer.observe(positionElement);
    }

    // window resize 이벤트도 함께 감지
    window.addEventListener("resize", checkHeight);

    // cleanup
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", checkHeight);
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
      {/* 고정된 상단 영역 */}
      <div className="flex-none space-y-3">
        <PriceInfo />
        <div className="w-full flex items-center justify-between">
          <TimeFrame />
          <AccountSelector />
        </div>
        <ChartComponent />
        <TradeComponent />
      </div>
      {/* 포지션 영역 */}
      <div
        id="position-component"
        className={cn(
          "mt-3",
          isCompact 
            ? "relative h-[50vh] bg-background" 
            : "flex-1 overflow-auto min-h-0"
        )}
      >
        <PositionComponent isCompact={isCompact} />
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
