import { useContext } from "react";
import { CCXTContext, supportExchanges, CCXTType } from "@/contexts/ccxt/type";

export const useCCXT = () => {
  const context = useContext(CCXTContext);
  if (context === undefined) {
    throw new Error("useCCXT must be used within a CCXTProvider");
  }
  return context.exchanges;
};

export { supportExchanges };
export type { CCXTType };
