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

const TradeInContexts = () => {
  const { tickerQuery } = useTrade();
  const [searchParams] = useSearchParams();
  const symbol = searchParams.get("symbol")!;

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
      {/* 스크롤 가능한 포지션 영역 */}
      <div className="flex-1 overflow-auto min-h-0 mt-3">
        <PositionComponent />
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
