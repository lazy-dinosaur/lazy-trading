import { LoadingSpinner } from "@/components/Loading";
import { DecryptedAccount, useAccounts } from "@/hooks/useAccounts";
import useExchange from "@/hooks/useExchange";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { PriceInfo } from "./Trade/price-info";

const Trade = () => {
  const { fetchTicker } = useExchange();
  const { data: tickerData, isLoading } = fetchTicker;
  const { useAllDecryptedAccounts } = useAccounts();
  const { exchange } = useParams();
  const { data } = useAllDecryptedAccounts();
  const [accounts, setAccounts] = useState<DecryptedAccount[]>();

  useEffect(() => {
    if (!accounts && data)
      setAccounts(() =>
        Object.values(data).filter((value) => value.exchange === exchange),
      );
  }, [data]);

  return (
    <div className="w-[450px] h-full">
      {!isLoading && tickerData ? (
        <>
          <PriceInfo data={tickerData} />
        </>
      ) : (
        <LoadingSpinner />
      )}
    </div>
  );
};
export default Trade;
