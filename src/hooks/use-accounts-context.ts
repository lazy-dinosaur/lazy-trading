import { useContext } from "react";
import { AccountsContext } from "@/contexts/accounts-context-type";

export const useAccounts = () => {
  const context = useContext(AccountsContext);
  if (context === undefined) {
    throw new Error("useAccounts must be used within an AccountsProvider");
  }

  return {
    accounts: context.fetchAccountQuery.data,
    decryptedAccounts: context.decryptedAccountsQuery.data,
    accountsDetails: context.accountsDetailQuery.data,
    isLoading:
      context.fetchAccountQuery.isLoading ||
      context.decryptedAccountsQuery.isLoading ||
      context.accountsDetailQuery.isLoading,
    addNewAccount: context.addAccountMutation.mutateAsync,
    validateAccount: context.validateAccountMutation.mutateAsync,
    refreshAccounts: () => {
      context.fetchAccountQuery.refetch();
      context.decryptedAccountsQuery.refetch();
      context.accountsDetailQuery.refetch();
    },
  };
};

export type {
  AccountInfo,
  AccountInfoType,
  BalancesType,
} from "@/contexts/accounts-context-type";
