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
import { useTrade } from "@/hooks/use-trade-context";
import { useSearchParams } from "react-router";
import { ChartComponent } from "@/components/trade/chart-component";
// import { useEffect } from "react";
// import { DecryptedAccount } from "@/lib/app-storage";
// import { useEffect, useState } from "react";

const Trade = () => {
  const { tickerQuery } = useTrade();
  const [searchParams] = useSearchParams();
  const symbol = searchParams.get("symbol")!;

  // const [isLoading, setLoading] = useState(true);
  // const [accounts, setAccounts] = useState<DecryptedAccount[]>();
  // const [selected, setSelected] = useState<string>();
  // const [timeframe, setTimeframe] = useState<TimeFrameType | undefined>(
  //   undefined,
  // );

  // const exchangeParam = searchParams.get("exchange") as ExchangeType;

  // const location = useLocation();
  // const exchange = location.state.exchange as ExchangeType;
  // const symbol = location.state.symbol;
  // const chartKey = `${exchange}-${symbol}-${timeframe}`;

  // const {
  //   // decryptedAccounts,
  //   accountsDetails,
  //   isLoading: isAccountsLoading,
  // } = useAccounts();
  //
  // useEffect(() => {
  //   console.log(accountsDetails);
  // }, [accountsDetails]);
  //
  // const { cache, isLoading: isCacheLoading, updateCache } = useCache();
  // const chartData = useChart(exchange, symbol, timeframe);

  // useEffect(() => {
  //   if (decryptedAccounts && !isAccountsLoading) {
  //     const filteredAccounts = Object.values(decryptedAccounts).filter(
  //       (account) => account.exchange == exchange,
  //     );
  //     setAccounts(filteredAccounts);
  //     if (filteredAccounts && filteredAccounts.length > 0) {
  //       setSelected(filteredAccounts[0].id);
  //     }
  //   }
  // }, [decryptedAccounts, isAccountsLoading]);

  // useEffect(() => {
  //   if (cache && !isCacheLoading && isLoading) {
  //     if (cache.data.timeframe) {
  //       setTimeframe(cache.data.timeframe);
  //     } else {
  //       setTimeframe("30");
  //     }
  //     setLoading(false);
  //   }
  // }, [cache, isCacheLoading, setTimeframe, setLoading, isLoading]);
  //
  // useEffect(() => {
  //   if (!isLoading && timeframe) {
  //     updateCache({ ...cache, data: { timeframe } });
  //   }
  // }, [isLoading, timeframe]);

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
      {/* {!isLoading && !isAccountsLoading && ticker && timeframe ? ( */}
      {/*   <> */}
      {/*     <PriceInfo data={ticker} isLoading={isTickerLoading} /> */}
      {/*     <div className="w-full flex items-center justify-between"> */}
      {/*       <TimeFrame timeFrameState={{ timeframe, setTimeframe }} /> */}
      {/*       <AccountSelector */}
      {/*         accountState={{ accounts, setAccounts }} */}
      {/*         selectedState={{ selected, setSelected }} */}
      {/*         accountsInfo={accountsDetails} */}
      {/*         isLoading={isAccountsLoading} */}
      {/*       /> */}
      {/*     </div> */}
      {/*     <ChartComponent */}
      {/*       chartKey={chartKey + "-trade"} */}
      {/*       candleData={chartData.data} */}
      {/*       handleChartScroll={chartData.handleScroll} */}
      {/*     /> */}
      {/*     <TradeComponent */}
      {/*       isLoading={isAccountsLoading} */}
      {/*       accountsInfo={accountsDetails?.[selected!]} */}
      {/*       candleData={chartData.data} */}
      {/*     /> */}
      {/*   </> */}
      {/* ) : ( */}
      {/*   <LoadingSpinner /> */}
      {/* )} */}
    </ScreenWrapper>
  );
};
export default Trade;
