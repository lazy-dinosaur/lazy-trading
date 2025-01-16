import { LoadingSpinner } from "@/components/loading";
import { AccountSelector } from "@/components/trade/account-select";
import { ChartComponent } from "@/components/trade/chart-component";
import { PriceInfo } from "@/components/trade/price-info";
import { TimeFrameType, TimeFrame } from "@/components/trade/time-frame";
import { TradeComponent } from "@/components/trade/trade-component";
import { useAccountsDetail } from "@/hooks/accounts";
import { useFetchCache, useUpdateCache } from "@/hooks/cache";
import { useChart } from "@/hooks/chart";
import { useFetchTicker } from "@/hooks/coin";
import { ExchangeType } from "@/hooks/useAccounts";
import { DecryptedAccount } from "@/lib/appStorage";
import { useEffect, useState } from "react";
import { useParams } from "react-router";

const Trade = () => {
  const params = useParams();
  const exchange = params.exchange as ExchangeType;
  const symbol = `${params.coin}/${params.base}`;

  const { data: ticker, isLoading: isTickerLoading } = useFetchTicker({
    exchange,
    symbol,
  });
  const { data: accountsDetails } = useAccountsDetail();
  const { data: cacheData, isLoading: isCacheLoading } = useFetchCache();
  const { mutate: updateCache } = useUpdateCache();

  const [accounts, setAccounts] = useState<DecryptedAccount[]>();
  const [selected, setSelected] = useState<number>(0);
  const [timeframe, setTimeframe] = useState<TimeFrameType | undefined>(
    undefined,
  );

  const [isLoading, setLoading] = useState(true);
  const chartData = useChart(exchange, symbol, timeframe);

  const chartKey = `${ticker?.exchange}-${ticker?.symbol}-${timeframe}`;

  useEffect(() => {
    if (
      cacheData &&
      ticker &&
      !isTickerLoading &&
      !timeframe &&
      isLoading &&
      !isCacheLoading
    ) {
      if (cacheData.data.timeframe) {
        setTimeframe(cacheData.data.timeframe);
      } else {
        setTimeframe("30");
      }
      setLoading(false);
    }
  }, [cacheData, ticker, isTickerLoading, isCacheLoading]);

  useEffect(() => {
    if (!isLoading && timeframe) {
      updateCache({ ...cacheData, data: { timeframe } });
    }
  }, [isLoading, timeframe]);

  //TODO: 스켈레톤 로딩으로 바꾸기
  return (
    <div key={chartKey} className="w-full h-full">
      {!isLoading && ticker && timeframe ? (
        <>
          <div className="w-full space-y-3">
            <PriceInfo data={ticker} />
            <div className="w-full flex items-center justify-between">
              <TimeFrame timeFrameState={{ timeframe, setTimeframe }} />
              <AccountSelector
                accountState={{ accounts, setAccounts }}
                selectedState={{ selected, setSelected }}
                exchange={ticker.exchange}
                accountsInfo={accountsDetails}
              />
            </div>
            <ChartComponent
              chartKey={chartKey + "-trade"}
              candleData={chartData.data}
              handleChartScroll={chartData.handleScroll}
            />
          </div>
          <TradeComponent
            id={accounts && accounts[selected]?.id}
            accountsInfo={accountsDetails}
          />
        </>
      ) : (
        <LoadingSpinner />
      )}
    </div>
  );
};
export default Trade;
