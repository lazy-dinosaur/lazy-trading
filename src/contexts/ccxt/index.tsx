import { useRef, useEffect, useState } from "react";
import { ExchangeInstances, createExchangeInstances } from "@/lib/ccxt";
import { CCXTType, CCXTContext } from "./type";

export function CCXTProvider({ children }: { children: React.ReactNode }) {
  const exchangeInstancesRef = useRef<ExchangeInstances | null>(null);
  const [exchanges, setExchanges] = useState<CCXTType | null>(null);

  useEffect(() => {
    exchangeInstancesRef.current = createExchangeInstances();

    if (exchangeInstancesRef.current) {
      const { bybit, binance, bitget } = exchangeInstancesRef.current;
      // 테스트 계정용
      bybit.ccxt.setSandboxMode(true);
      bybit.pro.setSandboxMode(true);
      binance.ccxt.setSandboxMode(true);
      binance.pro.setSandboxMode(true);
      binance.ccxt.options.defaultType = "swap";
      binance.pro.options.defaultType = "swap";

      const loadMarkets = async () => {
        try {
          const [bybitMarkets, binanceMarkets, bitgetMarkets] =
            await Promise.all([
              bybit.ccxt.loadMarkets(),
              binance.ccxt.loadMarkets(),
              bitget.ccxt.loadMarkets(),
            ]);

          setExchanges({
            bybit: {
              ccxt: bybit.ccxt,
              pro: bybit.pro,
              features: bybit.ccxt.features,
              markets: bybitMarkets,
            },
            binance: {
              ccxt: binance.ccxt,
              pro: binance.pro,
              features: binance.ccxt.features,
              markets: binanceMarkets,
            },
            bitget: {
              ccxt: bitget.ccxt,
              pro: bitget.pro,
              features: bitget.ccxt.features,
              markets: bitgetMarkets,
            },
          });
        } catch (error) {
          console.error("Error loading markets:", error);
        }
      };

      loadMarkets();
    }

    return () => {
      if (exchangeInstancesRef.current) {
        Object.values(exchangeInstancesRef.current).forEach(async ({ pro }) => {
          try {
            await pro.close();
          } catch (error) {
            console.error("Error closing exchange connection:", error);
          }
        });
        exchangeInstancesRef.current = null;
        setExchanges(null);
      }
    };
  }, []);

  return (
    <CCXTContext.Provider value={{ exchanges }}>
      {children}
    </CCXTContext.Provider>
  );
}
