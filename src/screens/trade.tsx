import { LoadingSpinner } from "@/components/Loading";
import { AccountSelector } from "@/components/trade/account-select";
import { Chart } from "@/components/trade/chart";
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
    <div className="w-[450px] h-full space-y-3">
      {!isLoading && tickerData ? (
        <>
          <PriceInfo data={tickerData} />
          <div className="w-full flex items-center justify-between">
            <TimeFrame timeFrameState={{ timeFrame, setTimeFrame }} />
            <AccountSelector
              accountState={{ accounts, setAccounts }}
              selectedState={{ selected, setSelected }}
              exchange={tickerData.exchange}
            />
          </div>
          <Chart timeFrame={timeFrame} tickerData={tickerData} />
        </>
      ) : (
        <LoadingSpinner />
      )}
    </div>
  );
};
export default Trade;
