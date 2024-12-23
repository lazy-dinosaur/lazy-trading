import { ExchangeType } from "./useAccounts";
import ccxt from "ccxt";
import { useQuery } from "@tanstack/react-query";

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

  return exchangeData;
};
export default useExchange;
