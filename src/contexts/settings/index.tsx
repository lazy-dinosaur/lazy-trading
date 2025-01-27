import { ReactNode, useEffect } from "react";
import {
  initialConfig,
  useFetchTradingConfig,
  useMutateTradingConfig,
} from "@/hooks/trading-config";
import { TradingConfigContext } from "./type";

export function TradingConfigProvider({ children }: { children: ReactNode }) {
  const { data: config, isLoading, error } = useFetchTradingConfig();
  const { mutate: updateConfig } = useMutateTradingConfig();

  useEffect(() => {
    if (!isLoading && !config) {
      updateConfig(initialConfig);
    }
  }, [config, isLoading, updateConfig]);

  return (
    <TradingConfigContext.Provider
      value={{
        config,
        isLoading,
        error: error as Error | null,
        updateConfig,
      }}
    >
      {children}
    </TradingConfigContext.Provider>
  );
}
