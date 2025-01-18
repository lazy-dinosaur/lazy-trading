import {
  getTradingConfig,
  setTradingConfig,
  TradingConfigType,
} from "@/lib/appStorage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useFetchTradingConfig = () =>
  useQuery({
    queryKey: ["tradingConfig"],
    queryFn: async () => {
      const config = await getTradingConfig();
      return (
        config || {
          risk: 1.5,
          riskRatio: 3,
          partialClose: false,
          closeRatio: 50,
          stopToEven: true,
        }
      );
    },
  });

export const useMutateTradingConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: Partial<TradingConfigType>) => {
      const currentConfig = (await getTradingConfig()) || {
        risk: 1.5,
        riskRatio: 3,
        partialClose: false,
        closeRatio: 50,
        stopToEven: true,
      };
      const newConfig = {
        risk: currentConfig.risk,
        riskRatio: currentConfig.riskRatio,
        partialClose: currentConfig.partialClose,
        closeRatio: currentConfig.closeRatio,
        stopToEven: currentConfig.stopToEven,
        ...config,
      } satisfies TradingConfigType;

      await setTradingConfig(newConfig);
      return newConfig;
    },
    onMutate: async (newConfig) => {
      // 이전 데이터 백업
      const previousConfig = queryClient.getQueryData<TradingConfigType>([
        "tradingConfig",
      ]);

      // Optimistic update
      queryClient.setQueryData<TradingConfigType>(["tradingConfig"], (old) => ({
        ...(old || {
          risk: 1.5,
          riskRatio: 3,
          partialClose: false,
          closeRatio: 50,
          stopToEven: true,
        }),
        ...newConfig,
      }));

      return { previousConfig };
    },
    onError: (_err, _newConfig, context) => {
      // 에러 발생 시 이전 상태로 롤백
      if (context?.previousConfig) {
        queryClient.setQueryData(["tradingConfig"], context.previousConfig);
      }
    },
    onSuccess: (newConfig) => {
      queryClient.setQueryData(["tradingConfig"], newConfig);
    },
    onSettled: () => {
      // 캐시 무효화하여 필요시 새로운 데이터 fetch
      queryClient.invalidateQueries({ queryKey: ["tradingConfig"] });
    },
  });
};
