import {
  AccountInfoType,
  AccountsContext,
  BalancesType,
} from "./accounts-context-type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePin } from "@/hooks/use-pin-context";
import { useCCXT } from "@/hooks/use-ccxt-context";
import { ExchangeType } from "@/hooks/useAccounts";
import {
  Accounts,
  addAccount,
  decryptAccount,
  DecryptedAccount,
  fetchAccounts,
  RawAccountInput,
} from "@/lib/appStorage";
import { BalanceMutationParams, calculateUSDBalance } from "@/lib/ccxtUtils";

const useFetchAccount = () =>
  useQuery({
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
    refetchInterval: 200,
  });

const decrypteAllAccounts = async (validPin: string, accounts: Accounts) => {
  if (!accounts || !validPin) return {};

  const decrypted: { [key: string]: DecryptedAccount } = {};
  for (const [id, account] of Object.entries(accounts)) {
    const decryptedAccount = await decryptAccount(account, validPin);
    if (decryptedAccount) {
      decrypted[id] = decryptedAccount;
    }
  }
  return decrypted;
};

const useAllDecryptedAccounts = () => {
  const { validPin } = usePin();
  const { data: accounts, isLoading } = useFetchAccount();
  return useQuery({
    queryKey: ["decryptedAccounts", validPin],
    queryFn: async () =>
      validPin && accounts ? await decrypteAllAccounts(validPin, accounts) : {},
    enabled: !!validPin && !isLoading && !!accounts,
    refetchInterval: 200,
  });
};

const useAccountsDetail = () => {
  const { data, isLoading: isDecrypting } = useAllDecryptedAccounts();
  const ccxt = useCCXT();
  return useQuery({
    queryKey: ["accountsDetails"],
    queryFn: async () => {
      if (!data || !ccxt)
        throw new Error("Accounts or exchange data not available");

      const accountsInfo: AccountInfoType = {};
      const accounts = Object.values(data);

      await Promise.all(
        accounts.map(async (account) => {
          try {
            const exchangeInstance = ccxt[account.exchange as ExchangeType].pro;
            exchangeInstance.apiKey = account.apiKey;
            exchangeInstance.secret = account.secretKey;

            const rawBalance = await exchangeInstance.fetchBalance();

            const usdBalance = await calculateUSDBalance(
              exchangeInstance,
              rawBalance,
            );
            const positions = await exchangeInstance.fetchPositions();
            const closed = await exchangeInstance.fetchClosedOrders(
              undefined,
              undefined,
              100,
            );
            const open = await exchangeInstance.fetchOpenOrders(
              undefined,
              undefined,
              100,
            );
            const positionsHistory =
              await exchangeInstance.fetchPositionsHistory();

            const balance = {
              ...rawBalance,
              usd: usdBalance,
            } as BalancesType;

            accountsInfo[account.id] = {
              account,
              balance,
              positions,
              positionsHistory,
              orders: { open, closed },
            };
          } catch (error) {
            console.error(
              `Error fetching balance for account ${account.id}:`,
              error,
            );
          }
        }),
      );
      return accountsInfo;
    },
    enabled: !!data && !isDecrypting && !!ccxt,
    refetchInterval: 500,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchIntervalInBackground: true,
  });
};

const useAddAccount = () => {
  const queryClient = useQueryClient();
  const { validPin } = usePin();
  return useMutation({
    mutationKey: ["addaccount"],
    mutationFn: async (rawAccount: RawAccountInput) =>
      await addAccount({ rawAccount, pin: validPin }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["accountsDetail"] });
      queryClient.invalidateQueries({ queryKey: ["decryptedAccounts"] });
    },
  });
};

const useIsAccountValid = () => {
  const ccxt = useCCXT();
  return useMutation({
    mutationFn: async ({ exchange, apikey, secret }: BalanceMutationParams) => {
      if (!ccxt) throw new Error("Exchange instances not initialized");

      const exchangeInstance = ccxt[exchange].ccxt;
      exchangeInstance.apiKey = apikey;
      exchangeInstance.secret = secret;
      exchangeInstance.password = "lazytrading";
      if (exchange == "binance") {
        exchangeInstance.options.headers = {
          "X-MBX-APIKEY": apikey,
        };
      }

      return await exchangeInstance.fetchBalance();
    },
  });
};

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
