import { ExchangeInstances, createExchangeInstances } from "@/lib/ccxtUtils";
import { useRef, useEffect } from "react";
import { ExchangeType } from "./useAccounts";
import { useQuery } from "@tanstack/react-query";
import { Exchange, Dictionary } from "ccxt";

export const supportExchanges: ExchangeType[] = ["bybit", "binance", "bitget"];

export type CCXTType = {
  [key in ExchangeType]: {
    ccxt: Exchange;
    pro: Exchange;
    features: Dictionary<Dictionary<any>>;
  };
};

export const useCCXT = () => {
  const exchangeInstancesRef = useRef<ExchangeInstances | null>(null);

  // Exchange 인스턴스 생성 및 정리
  useEffect(() => {
    exchangeInstancesRef.current = createExchangeInstances();

    return () => {
      // Cleanup function
      if (exchangeInstancesRef.current) {
        Object.values(exchangeInstancesRef.current).forEach(async ({ pro }) => {
          try {
            await pro.close(); // WebSocket 연결 정리
          } catch (error) {
            console.error("Error closing exchange connection:", error);
          }
        });
        exchangeInstancesRef.current = null;
      }
    };
  }, []);

  return useQuery({
    queryKey: ["exchanges", supportExchanges],
    queryFn: async () => {
      if (!exchangeInstancesRef.current) {
        throw new Error("Exchange instances not initialized");
      }

      const { bybit, binance, bitget } = exchangeInstancesRef.current;

      return {
        bybit: {
          ccxt: bybit.ccxt,
          pro: bybit.pro,
          features: bybit.ccxt.features,
        },
        binance: {
          ccxt: binance.ccxt,
          pro: binance.pro,
          features: binance.ccxt.features,
        },
        bitget: {
          ccxt: bitget.ccxt,
          pro: bitget.pro,
          features: bitget.ccxt.features,
        },
      };
    },
    refetchInterval: 10,
  });
};
