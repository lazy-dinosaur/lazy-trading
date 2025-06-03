import { ExchangeType } from "@/lib/accounts";
import { Exchange, Dictionary, Market } from "ccxt";
import { createContext } from "react";

export const supportExchanges: ExchangeType[] = ["bybit", "binance", "bitget"];

export type CCXTType = {
  [key in ExchangeType]: {
    ccxt: Exchange;
    pro: Exchange;
    features: Dictionary<Dictionary<any>>;
    markets: Dictionary<Market>;
  };
};

export interface CCXTContextType {
  exchanges: CCXTType | null;
}

export const CCXTContext = createContext<CCXTContextType | undefined>(
  undefined,
);
