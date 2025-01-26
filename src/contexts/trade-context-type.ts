import { useFetchTicker } from "@/hooks/coin";
import { DecryptedAccount } from "@/lib/app-storage";
import { createContext } from "react";
import { AccountInfoType } from "./accounts-context-type";

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
