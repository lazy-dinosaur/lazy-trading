import { useFetchTicker, useMarketInfo } from "@/hooks/coin";
import { createContext } from "react";
import { AccountInfoType, DecryptedAccount } from "@/lib/accounts";
import { PositionInfo } from "@/lib/trade";
import { useOrder } from "@/hooks/trade";
export type FormattedCurrecy = {
  total: string | number;
  used: string | number;
  free: string | number;
};

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
  tradeInfo: TradeInfoType;
  tickerQuery: ReturnType<typeof useFetchTicker>;
  marketInfoQuery: ReturnType<typeof useMarketInfo>;
  createOrder: ReturnType<typeof useOrder>;
  exchangeAccounts?: DecryptedAccount[];
  accountsDetails?: AccountInfoType;
  isAccountsLoading: boolean;
  id?: string;
  isLoaded: boolean;
  balanceInfo?: {
    base: FormattedCurrecy & { name: string };
    usd: FormattedCurrecy;
  };
}

export const TradeContext = createContext<TradeContextType | undefined>(
  undefined,
);
