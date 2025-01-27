import { useContext } from "react";
import { TradingConfigContext } from "./type";

export function useTradingConfig() {
  const context = useContext(TradingConfigContext);
  if (context === undefined) {
    throw new Error(
      "useTradingConfig must be used within a TradingConfigProvider",
    );
  }
  return context;
}
