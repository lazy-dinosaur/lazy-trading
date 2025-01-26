import { createContext } from "react";
import { DecryptedAccount } from "@/lib/app-storage";
import { Position, Order, Balance, Balances } from "ccxt";
import {
  useFetchAccount,
  useAllDecryptedAccounts,
  useAccountsDetail,
  useAddAccount,
  useIsAccountValid,
} from "@/lib/accounts";

export interface USDBalance {
  total: number;
  used: number;
  free: number;
}

export type BalancesType = Balances &
  Balance & {
    [keyof: string]: any;
    usd: USDBalance;
  };

export type AccountInfo = {
  account: DecryptedAccount;
  balance: BalancesType;
  positions: Position[];
  positionsHistory: Position[];
  orders: {
    open: Order[];
    closed: Order[];
  };
};

export type AccountInfoType = {
  [keyof: string]: AccountInfo;
};

export interface AccountsContextType {
  fetchAccountQuery: ReturnType<typeof useFetchAccount>;
  decryptedAccountsQuery: ReturnType<typeof useAllDecryptedAccounts>;
  accountsDetailQuery: ReturnType<typeof useAccountsDetail>;
  addAccountMutation: ReturnType<typeof useAddAccount>;
  validateAccountMutation: ReturnType<typeof useIsAccountValid>;
}

export const AccountsContext = createContext<AccountsContextType | undefined>(
  undefined,
);
