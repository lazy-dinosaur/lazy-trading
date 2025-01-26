import {
  useFetchAccount,
  useAllDecryptedAccounts,
  useAccountsDetail,
  useAddAccount,
  useIsAccountValid,
} from "@/lib/accounts";
import { AccountsContext } from "./type";

export function AccountsProvider({ children }: { children: React.ReactNode }) {
  const fetchAccountQuery = useFetchAccount();
  const decryptedAccountsQuery = useAllDecryptedAccounts();
  const accountsDetailQuery = useAccountsDetail();
  const addAccountMutation = useAddAccount();
  const validateAccountMutation = useIsAccountValid();

  return (
    <AccountsContext.Provider
      value={{
        fetchAccountQuery,
        decryptedAccountsQuery,
        accountsDetailQuery,
        addAccountMutation,
        validateAccountMutation,
      }}
    >
      {children}
    </AccountsContext.Provider>
  );
}
