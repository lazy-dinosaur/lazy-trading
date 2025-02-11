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
        setIsCompact(positionElement.scrollHeight < vh);
      }
    };

    checkHeight();
    window.addEventListener("resize", checkHeight);
    return () => window.removeEventListener("resize", checkHeight);
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
        className={`${
          isCompact
            ? "relative h-[50vh] hover:fixed hover:bottom-0 hover:left-0 hover:right-0 hover:bg-background hover:z-50 hover:shadow-lg transition-all duration-300 ease-in-out"
            : "flex-1 overflow-auto min-h-0"
        } mt-3`}
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
