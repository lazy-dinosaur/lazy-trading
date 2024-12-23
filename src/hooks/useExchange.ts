import { ExchangeType } from "./useAccounts";
import ccxt from "ccxt";
import { useMutation, useQuery } from "@tanstack/react-query";

interface BalanceMutationParams {
  exchange: ExchangeType;
  apikey: string;
  secret: string;
}

export const supportExchanges: ExchangeType[] = ["bybit", "binance", "bitget"];
const useExchange = () => {
  // const [exchanges, setExchanges] = useState({});
  const exchangeData = useQuery({
    queryKey: ["exchanges", supportExchanges],
    queryFn: async () => {
      const bybit = new ccxt.bybit();
      const binance = new ccxt.binance();
      const bitget = new ccxt.bitget();
      const bybitPro = new ccxt.pro.bybit();
      const binancePro = new ccxt.pro.binance();
      const bitgetPro = new ccxt.pro.bitget();

      const bybitMarket = await bybit
        .fetchMarkets()
        .then((value) => value.filter((value) => value?.type == "swap"));
      const binanceMarket = await binance
        .fetchMarkets()
        .then((value) => value.filter((value) => value?.type == "swap"));
      const bitgetMarket = await bitget
        .fetchMarkets()
        .then((value) => value.filter((value) => value?.type == "swap"));

      return {
        bybit: {
          ccxt: bybit,
          pro: bybitPro,
          market: bybitMarket,
          features: bybit.features,
        },
        binance: {
          ccxt: binance,
          pro: binancePro,
          market: binanceMarket,
          features: binance.features,
        },
        bitget: {
          ccxt: bitget,
          pro: bitgetPro,
          market: bitgetMarket,
          features: bitget.features,
        },
      };
    },
  });
  const fetchBalance = useMutation({
    mutationFn: async ({ exchange, apikey, secret }: BalanceMutationParams) => {
      if (!exchangeData.isLoading && exchangeData.data) {
        const { data } = exchangeData;

        const exchangeInstance = data[exchange].ccxt;
        exchangeInstance.apiKey = apikey;
        exchangeInstance.secret = secret;

        return await exchangeInstance.fetchBalance();
      }
      throw new Error("Exchange data not available");
    },
  });

  return { exchangeData, fetchBalance };
};
export default useExchange;
