import { useQuery } from "@tanstack/react-query";
import { ExchangeType } from "./accounts";
import { CCXTType } from "@/contexts/ccxt/type";
import { useCCXT } from "@/contexts/ccxt/use";

export const fetchTradingFees = async (
  ccxt: CCXTType,
  exchange: ExchangeType,
  symbol: string,
) => {
  if (!ccxt?.[exchange]) {
    throw new Error("Exchange instance not initialized");
  }

  try {
    const exchangeInstance = ccxt[exchange].pro;

    // 거래소별 수수료 정보 가져오기
    const fees = await exchangeInstance.fetchTradingFee(symbol);

    return {
      maker: fees.maker, // 메이커 수수료
      taker: fees.taker, // 테이커 수수료
    };
  } catch (error) {
    console.error(`Error fetching fees for ${exchange}:`, error);

    try {
      const exchangeInstance = ccxt[exchange].pro;

      // 마켓 정보 로드 (수수료 포함)
      const market = exchangeInstance.market(symbol);

      return {
        // 기본 수수료 정보
        maker: market.maker,
        taker: market.taker,
        limits: market.limits,
        precision: market.precision,
      };
    } catch (error) {
      console.error(`Error fetching market info for ${exchange}:`, error);
      return null;
    }
  }
};

export const useTradingFees = (exchange: ExchangeType, symbol: string) => {
  const ccxt = useCCXT();

  return useQuery({
    queryKey: [exchange, symbol, "fees"],
    queryFn: async () => await fetchTradingFees(ccxt!, exchange, symbol),
    enabled: !!ccxt,
  });
};
