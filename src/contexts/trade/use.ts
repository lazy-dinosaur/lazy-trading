import { TradeContext } from "@/contexts/trade/type";
import { useContext } from "react";

export const useTrade = () => {
  const context = useContext(TradeContext);
  if (context === undefined) {
    throw new Error("useTrade must be used within a TradeProvider");
  }

  return context;
};
