import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { usePin } from "@/contexts/pin/use";
import {
  addAccount,
  BalanceMutationParams,
  decrypteAllAccounts,
  fetchAccounts,
  fetchAccountsDetail,
  isAccountValid,
  RawAccountInput,
} from "@/lib/accounts";

export const useFetchAccount = () =>
  useQuery({
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
    refetchInterval: 200,
  });

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
  return useQuery({
    queryKey: ["accountsDetails"],
    queryFn: async () => await fetchAccountsDetail(data),
    enabled: !!data && !isDecrypting,
    refetchInterval: 1500,
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
  return useMutation({
    mutationFn: async ({ exchange, apikey, secret }: BalanceMutationParams) => {
      return isAccountValid({ exchange, apikey, secret });
    },
  });
};
