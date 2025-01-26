import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  fetchAccounts,
  Accounts,
  DecryptedAccount,
  decryptAccount,
  RawAccountInput,
  addAccount,
} from "./app-storage";

import { AccountInfoType, BalancesType } from "@/contexts/accounts/type";
import { BalanceMutationParams } from "./ccxt";
import { useCCXT } from "@/contexts/ccxt/use";
import { usePin } from "@/contexts/pin/use";

export type ExchangeType = "bitget" | "binance" | "bybit";

export const useFetchAccount = () =>
  useQuery({
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
    refetchInterval: 200,
  });

export const decrypteAllAccounts = async (
  validPin: string,
  accounts: Accounts,
) => {
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

export const useAllDecryptedAccounts = () => {
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

export const useAccountsDetail = () => {
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
            const exchangeInstance =
              ccxt[account.exchange as ExchangeType].ccxt;
            exchangeInstance.apiKey = account.apiKey;
            exchangeInstance.secret = account.secretKey;

            const rawBalance = await exchangeInstance.fetchBalance();

            // const usdBalance = await calculateUSDBalance(
            //   exchangeInstance,
            //   rawBalance,
            // );

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
              // usd: usdBalance,
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

export const useAddAccount = () => {
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

export const useIsAccountValid = () => {
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
