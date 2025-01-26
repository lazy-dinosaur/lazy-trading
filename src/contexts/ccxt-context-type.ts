import { ExchangeType } from "@/lib/accounts";
import { Exchange, Dictionary } from "ccxt";
import { createContext } from "react";

export const supportExchanges: ExchangeType[] = ["bybit", "binance", "bitget"];

export type CCXTType = {
  [key in ExchangeType]: {
    ccxt: Exchange;
    pro: Exchange;
    features: Dictionary<Dictionary<any>>;
  };
};

export interface CCXTContextType {
  exchanges: CCXTType | null;
}

export const CCXTContext = createContext<CCXTContextType | undefined>(
  undefined,
);
