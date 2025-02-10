import { AccountsContext } from "@/contexts/accounts/type";
import { useContext } from "react";

export const useAccounts = () => {
  const context = useContext(AccountsContext);
  if (context === undefined) {
    throw new Error("useAccounts must be used within an AccountsProvider");
  }

  return {
    accounts: context.fetchAccountQuery.data,
    decryptedAccounts: context.decryptedAccountsQuery.data,
    accountsBalance: context.accountsBalanceQuery.data,
    isLoading:
      context.fetchAccountQuery.isLoading ||
      context.decryptedAccountsQuery.isLoading ||
      context.accountsBalanceQuery.isLoading,
    addNewAccount: context.addAccountMutation.mutateAsync,
    validateAccount: context.validateAccountMutation.mutateAsync,
    refreshAccounts: () => {
      context.fetchAccountQuery.refetch();
      context.decryptedAccountsQuery.refetch();
      context.accountsBalanceQuery.refetch();
    },
  };
};

export type {
  AccountBalanceInfo,
  AccountBalanceInfoType,
  BalancesType,
} from "@/lib/accounts";
