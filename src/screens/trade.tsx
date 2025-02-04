// import { LoadingSpinner } from "@/components/loading";
import { AccountSelector } from "@/components/trade/account-select";
// import { ChartComponent } from "@/components/trade/chart-component";
// import { PriceInfo } from "@/components/trade/price-info";
import { TimeFrame } from "@/components/trade/time-frame";
// import { TradeComponent } from "@/components/trade/trade-component";
// import { useChart } from "@/hooks/chart";
// import { useFetchTicker } from "@/hooks/coin";
// import { useAccounts } from "@/hooks/use-accounts-context";
// import { useCache } from "@/hooks/use-cache-context";
// import { ExchangeType } from "@/lib/accounts";
import { ScreenWrapper } from "@/components/screen-wrapper";
import { PriceInfo } from "@/components/trade/price-info";
import { useTrade } from "@/contexts/trade/use";
import { useSearchParams } from "react-router";
import { ChartComponent } from "@/components/trade/chart-component";
import { TradeComponent } from "@/components/trade/trade-component";
// import { useEffect } from "react";
// import { DecryptedAccount } from "@/lib/app-storage";
// import { useEffect, useState } from "react";

const Trade = () => {
  const { tickerQuery } = useTrade();
  const [searchParams] = useSearchParams();
  const symbol = searchParams.get("symbol")!;

  //TODO: 스켈레톤 로딩으로 바꾸기
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
export default Trade;
