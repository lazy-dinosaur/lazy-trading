import { LoadingSpinner } from "@/components/loading";
import { AccountSelector } from "@/components/trade/account-select";
import { ChartComponent } from "@/components/trade/chart-component";
import { PriceInfo } from "@/components/trade/price-info";
import { TimeFrameType, TimeFrame } from "@/components/trade/time-frame";
import { DecryptedAccount } from "@/hooks/useAccounts";
import { useTicker } from "@/hooks/useExchange";
import { useState } from "react";

const Trade = () => {
  const { data: tickerData, isLoading } = useTicker();
  const [accounts, setAccounts] = useState<DecryptedAccount[]>();
  const [selected, setSelected] = useState<number>(0);
  const [timeFrame, setTimeFrame] = useState<TimeFrameType>("30");

  return (
    <div className="w-[450px] h-max">
      {!isLoading && tickerData ? (
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
          <div className="w-full h-40 bg-slate-900">ddd</div>
        </>
      ) : (
        <LoadingSpinner />
      )}
    </div>
  );
};
export default Trade;
