import { useFetchTicker } from "@/hooks/coin";
import { createContext } from "react";
import { AccountInfoType, DecryptedAccount } from "@/lib/accounts";

export interface TradeContextType {
  tickerQuery: ReturnType<typeof useFetchTicker>;
  exchangeAccounts?: DecryptedAccount[];
  accountsDetails?: AccountInfoType;
  isAccountsLoading: boolean;
  id?: string;
  isLoaded: boolean;
}

export const TradeContext = createContext<TradeContextType | undefined>(
  undefined,
);
