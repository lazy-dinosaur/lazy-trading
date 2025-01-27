import { useFetchTicker, useMarketInfo } from "@/hooks/coin";
import { createContext } from "react";
import { AccountInfoType, DecryptedAccount } from "@/lib/accounts";
import { PositionInfo } from "@/lib/trade";

export type TradeInfoType =
  | {
      long: PositionInfo;
      short: PositionInfo;
      currentPrice: number;
      tradingfee: {
        maker: number;
        taker: number;
      };
      maxLeverage: number;
    }
  | undefined;

export interface TradeContextType {
  tickerQuery: ReturnType<typeof useFetchTicker>;
  marketInfoQuery: ReturnType<typeof useMarketInfo>;
  exchangeAccounts?: DecryptedAccount[];
  accountsDetails?: AccountInfoType;
  isAccountsLoading: boolean;
  id?: string;
  isLoaded: boolean;
}

export const TradeContext = createContext<TradeContextType | undefined>(
  undefined,
);
