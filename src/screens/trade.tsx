import { AccountSelector } from "@/components/trade/account-select";
import { TimeFrame } from "@/components/trade/time-frame";
import { ScreenWrapper } from "@/components/screen-wrapper";
import { PriceInfo } from "@/components/trade/price-info";
import { useTrade } from "@/contexts/trade/use";
import { useSearchParams } from "react-router";
import { ChartComponent } from "@/components/trade/chart-component";
import { TradeComponent } from "@/components/trade/trade-component";
import { ChartDataProvider } from "@/contexts/chart-data";
import { TradeProvider } from "@/contexts/trade";

const TradeInContexts = () => {
  const { tickerQuery } = useTrade();
  const [searchParams] = useSearchParams();
  const symbol = searchParams.get("symbol")!;

  return (
    <ScreenWrapper
      className={["space-y-3"]}
      headerProps={{
        ticker: {
          symbol: symbol ? symbol : undefined,
          percentage: tickerQuery.data?.percentage,
          isTickerLoading: tickerQuery.isLoading,
        },
        backButton: true,
      }}
    >
      <PriceInfo />
      <div className="w-full flex items-center justify-between">
        <TimeFrame />
        <AccountSelector />
      </div>
      <ChartComponent />
      <TradeComponent />
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
