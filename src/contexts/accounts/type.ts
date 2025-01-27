import { createContext } from "react";
import {
  useFetchAccount,
  useAllDecryptedAccounts,
  useAccountsDetail,
  useAddAccount,
  useIsAccountValid,
} from "@/hooks/accounts";

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
