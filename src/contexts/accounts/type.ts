import { createContext } from "react";
import {
  useFetchAccount,
  useAllDecryptedAccounts,
  useAccountsBalance,
  useAddAccount,
  useIsAccountValid,
} from "@/hooks/accounts";

export interface AccountsContextType {
  fetchAccountQuery: ReturnType<typeof useFetchAccount>;
  decryptedAccountsQuery: ReturnType<typeof useAllDecryptedAccounts>;
  accountsBalanceQuery: ReturnType<typeof useAccountsBalance>;
  addAccountMutation: ReturnType<typeof useAddAccount>;
  validateAccountMutation: ReturnType<typeof useIsAccountValid>;
}

export const AccountsContext = createContext<AccountsContextType | undefined>(
  undefined,
);
