import { useFetchTicker, useMarketInfo } from "@/hooks/coin";
import { createContext } from "react";
import { AccountBalanceInfoType, DecryptedAccount } from "@/lib/accounts";
import { PositionInfo } from "@/lib/trade";
import { LeverageTier } from "ccxt";
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
      leverageInfo: { maxLeverage: number; leverageTier?: LeverageTier[] };
    }
  | undefined;

export interface TradeContextType {
  tradeInfo: TradeInfoType;
  tickerQuery: ReturnType<typeof useFetchTicker>;
  marketInfoQuery: ReturnType<typeof useMarketInfo>;
  exchangeAccounts?: DecryptedAccount[];
  accountsBalance?: AccountBalanceInfoType;
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
