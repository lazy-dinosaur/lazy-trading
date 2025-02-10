import {
  useFetchAccount,
  useAllDecryptedAccounts,
  useAccountsBalance,
  useAddAccount,
  useIsAccountValid,
} from "@/hooks/accounts";
import { AccountsContext } from "./type";

export function AccountsProvider({ children }: { children: React.ReactNode }) {
  const fetchAccountQuery = useFetchAccount();
  const decryptedAccountsQuery = useAllDecryptedAccounts();
  const accountsBalanceQuery = useAccountsBalance();
  const addAccountMutation = useAddAccount();
  const validateAccountMutation = useIsAccountValid();

  return (
    <AccountsContext.Provider
      value={{
        fetchAccountQuery,
        decryptedAccountsQuery,
        accountsBalanceQuery,
        addAccountMutation,
        validateAccountMutation,
      }}
    >
      {children}
    </AccountsContext.Provider>
  );
}
