import { useQuery } from "@tanstack/react-query";
import { fetchAllTickers, fetchMarketInfo, fetchTicker } from "@/lib/coin";
import { supportExchanges, useCCXT } from "../contexts/ccxt/use";
import { ExchangeType } from "@/lib/accounts";

// 티커 정보 전용 쿼리
export const useAllTickers = () => {
  const ccxt = useCCXT();
  return useQuery({
    queryKey: ["allTickers", supportExchanges],
    queryFn: async () => ccxt && (await fetchAllTickers(ccxt)),
    refetchInterval: 1000 * 30, // 30초마다 자동 갱신
    enabled: !!ccxt,
  });
};

export const useFetchTicker = ({
  exchange,
  symbol,
}: {
  exchange: ExchangeType;
  symbol: string;
}) => {
  const ccxt = useCCXT();
  return useQuery({
    queryKey: [exchange, symbol, "ticker"],
    queryFn: async () =>
      ccxt ? await fetchTicker({ ccxt, exchange, symbol }) : undefined,
    enabled: !!ccxt && !!exchange && !!symbol,
    refetchInterval: 500,
    refetchIntervalInBackground: true,
    refetchOnMount: true,
  });
};

export const useMarketInfo = (exchange: ExchangeType, symbol: string) => {
  const ccxt = useCCXT();

  return useQuery({
    queryKey: [exchange, symbol, "market"],
    queryFn: () => ccxt && fetchMarketInfo(ccxt, exchange, symbol),
    enabled: !!ccxt && !!exchange && !!symbol,
  });
};
