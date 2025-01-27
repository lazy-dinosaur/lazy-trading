import { TradingConfigType } from "@/lib/trading-config";
import { createContext } from "react";

export interface TradingConfigContextType {
  config: TradingConfigType | undefined;
  isLoading: boolean;
  error: Error | null;
  updateConfig: (newConfig: Partial<TradingConfigType>) => void;
}

export const TradingConfigContext = createContext<
  TradingConfigContextType | undefined
>(undefined);
