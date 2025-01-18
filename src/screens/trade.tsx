import { LoadingSpinner } from "@/components/loading";
import { AccountSelector } from "@/components/trade/account-select";
import { ChartComponent } from "@/components/trade/chart-component";
import { PriceInfo } from "@/components/trade/price-info";
import { TimeFrameType, TimeFrame } from "@/components/trade/time-frame";
import { TradeComponent } from "@/components/trade/trade-component";
import { useAccountsDetail, useAllDecryptedAccounts } from "@/hooks/accounts";
import { useFetchCache, useUpdateCache } from "@/hooks/cache";
import { useChart } from "@/hooks/chart";
import { useFetchTicker } from "@/hooks/coin";
import { ExchangeType } from "@/hooks/useAccounts";
import { DecryptedAccount } from "@/lib/appStorage";
import { useEffect, useState } from "react";
import { useParams } from "react-router";

const Trade = () => {
  const [isLoading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<DecryptedAccount[]>();
  const [selected, setSelected] = useState<number>(0);
  const [timeframe, setTimeframe] = useState<TimeFrameType | undefined>(
    undefined,
  );
  const params = useParams();
  const exchange = params.exchange as ExchangeType;
  const symbol = `${params.coin}/${params.base}`;
  const chartKey = `${exchange}-${symbol}-${timeframe}`;

  const { data: ticker, isLoading: isTickerLoading } = useFetchTicker({
    exchange,
    symbol,
  });
  const { data: accountsDetails } = useAccountsDetail();
  const { data: cacheData, isLoading: isCacheLoading } = useFetchCache();
  const { mutate: updateCache } = useUpdateCache();
  const chartData = useChart(exchange, symbol, timeframe);

  const { data: decryptedAccounts, isLoading: isDecryptLoading } =
    useAllDecryptedAccounts();

  useEffect(() => {
    if (decryptedAccounts && !isDecryptLoading)
      setAccounts(
        Object.values(decryptedAccounts).filter(
          (account) => account.exchange == exchange,
        ),
      );
  }, [decryptedAccounts, isDecryptLoading]);

  useEffect(() => {
    if (cacheData && !isCacheLoading && isLoading) {
      if (cacheData.data.timeframe) {
        setTimeframe(cacheData.data.timeframe);
      } else {
        setTimeframe("30");
      }
      setLoading(false);
    }
  }, [cacheData, isCacheLoading, setTimeframe, setLoading, isLoading]);

  useEffect(() => {
    if (!isLoading && timeframe) {
      updateCache({ ...cacheData, data: { timeframe } });
    }
  }, [isLoading, timeframe]);

  //TODO: 스켈레톤 로딩으로 바꾸기
  return (
    <div key={chartKey} className="w-full h-full space-y-3 flex flex-col">
      {!isLoading && ticker && timeframe ? (
        <>
          <PriceInfo data={ticker} isLoading={isTickerLoading} />
          <div className="w-full flex items-center justify-between">
            <TimeFrame timeFrameState={{ timeframe, setTimeframe }} />
            <AccountSelector
              accountState={{ accounts, setAccounts }}
              selectedState={{ selected, setSelected }}
              accountsInfo={accountsDetails}
            />
          </div>
          <ChartComponent
            chartKey={chartKey + "-trade"}
            candleData={chartData.data}
            handleChartScroll={chartData.handleScroll}
          />
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
