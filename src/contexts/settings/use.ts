import { useContext } from "react";
import { SettingsContext, TradingConfigContext } from "./type";

export const useSettings = () => {
  const context = useContext(SettingsContext);
  
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  
  return context;
};

export const useTradingConfig = () => {
  const context = useContext(TradingConfigContext);
  
  if (!context) {
    throw new Error("useTradingConfig must be used within a TradingConfigProvider");
  }
  
  return context;
};