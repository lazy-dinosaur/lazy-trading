import { ExchangeType } from "./useAccounts";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import {
  BalanceMutationParams,
  createExchangeInstances,
  ExchangeInstances,
  fetchAllMarkets,
  fetchAllTickers,
  fetchValid,
} from "@/lib/ccxtUtils";

export const supportExchanges: ExchangeType[] = ["bybit", "binance", "bitget"];

export const useExchange = () => {
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

  // Exchange 기본 정보 쿼리
  const exchangeData = useQuery({
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

  // 티커 정보 전용 쿼리
  const tickerData = useQuery({
    queryKey: ["tickers", supportExchanges],
    queryFn: async () => await fetchAllTickers({ exchangeInstancesRef }),
    refetchInterval: 1000 * 30, // 30초마다 자동 갱신
  });
  const marketData = useQuery({
    queryKey: ["tickers", supportExchanges],
    queryFn: async () => await fetchAllMarkets({ exchangeInstancesRef }),
  });

  const isAccountValidQuery = useMutation({
    mutationFn: async ({ exchange, apikey, secret }: BalanceMutationParams) =>
      await fetchValid({ exchangeInstancesRef, exchange, apikey, secret }),
  });

  return {
    exchangeData,
    tickerData,
    fetchValid: isAccountValidQuery,
    marketData,
  };
};
