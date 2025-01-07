import { LoadingSpinner } from "@/components/loading";
import { AccountSelector } from "@/components/trade/account-select";
import { ChartComponent } from "@/components/trade/chart-component";
import { PriceInfo } from "@/components/trade/price-info";
import { TimeFrameType, TimeFrame } from "@/components/trade/time-frame";
import { TradeComponent } from "@/components/trade/trade-component";
import { DecryptedAccount } from "@/hooks/useAccounts";
import { useAppStateCache } from "@/hooks/useAppStateCache";
import { useChartData } from "@/hooks/useChartData";
import { useEffect, useState } from "react";

const Trade = () => {
  const {
    fetchTicker: { data: tickerData, isLoading: isTickerLoading },
  } = useChartData({});
  const { appState, updateState } = useAppStateCache();
  const [accounts, setAccounts] = useState<DecryptedAccount[]>();
  const [selected, setSelected] = useState<number>(0);
  const [timeFrame, setTimeFrame] = useState<TimeFrameType | null>(null);
  const [isLoading, setLoading] = useState(true);

  const chartKey = `${tickerData?.exchange}-${tickerData?.symbol}-${timeFrame}-trade`;

  useEffect(() => {
    if (appState && tickerData && !isTickerLoading && !timeFrame && isLoading) {
      if (appState.data.timeFrame) {
        setTimeFrame(appState.data.timeFrame);
      } else {
        setTimeFrame("30");
      }
      setLoading(false);
    }
  }, [appState, tickerData, isTickerLoading]);

  useEffect(() => {
    if (!isLoading && timeFrame) {
      updateState({ ...appState, data: { timeFrame } });
    }
  }, [isLoading, timeFrame]);
  //TODO: 스켈레톤 로딩으로 바꾸기
  return (
    <div key={chartKey} className="w-[450px] h-max">
      {!isLoading && tickerData && timeFrame ? (
        <>
          <div className="w-full space-y-3">
            <PriceInfo data={tickerData} />
            <div className="w-full flex items-center justify-between">
              <TimeFrame timeFrameState={{ timeFrame, setTimeFrame }} />
              <AccountSelector
                accountState={{ accounts, setAccounts }}
                selectedState={{ selected, setSelected }}
                exchange={tickerData.exchange}
              />
            </div>
            <ChartComponent timeFrame={timeFrame} tickerData={tickerData} />
          </div>
          <TradeComponent />
        </>
      ) : (
        <LoadingSpinner />
      )}
    </div>
  );
};
export default Trade;
