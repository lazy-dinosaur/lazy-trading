import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface ExchangeKey {
  apiKey: string;
  secretKey: string;
}

interface ExchangeKeys {
  [exchangeName: string]: ExchangeKey;
}

// 모든 거래소 키 조회
const fetchExchangeKeys = async (): Promise<ExchangeKeys> => {
  try {
    const result = await chrome.storage.local.get(["exchangeKeys"]);
    return result.exchangeKeys || {};
  } catch (error) {
    console.error("Failed to fetch exchange keys:", error);
    return {};
  }
};

// // 특정 거래소 키 조회
// const fetchExchangeKey = async (
//   exchangeName: string,
// ): Promise<ExchangeKey | null> => {
//   try {
//     const keys = await fetchExchangeKeys();
//     return keys[exchangeName] || null;
//   } catch (error) {
//     console.error(`Failed to fetch ${exchangeName} keys:`, error);
//     return null;
//   }
// };

// 거래소 키 저장
const setExchangeKey = async (
  exchangeName: string,
  keys: ExchangeKey,
): Promise<boolean> => {
  try {
    const currentKeys = await fetchExchangeKeys();
    const updatedKeys = {
      ...currentKeys,
      [exchangeName]: keys,
    };
    await chrome.storage.local.set({ exchangeKeys: updatedKeys });
    return true;
  } catch (error) {
    console.error(`Failed to set ${exchangeName} keys:`, error);
    return false;
  }
};

// 거래소 키 삭제
const deleteExchangeKey = async (exchangeName: string): Promise<boolean> => {
  try {
    const currentKeys = await fetchExchangeKeys();
    delete currentKeys[exchangeName];
    await chrome.storage.local.set({ exchangeKeys: currentKeys });
    return true;
  } catch (error) {
    console.error(`Failed to delete ${exchangeName} keys:`, error);
    return false;
  }
};

export function useExchangeKeys() {
  const queryClient = useQueryClient();

  // 모든 거래소 키 조회
  const { data: exchangeKeys, isLoading } = useQuery({
    queryKey: ["exchangeKeys"],
    queryFn: fetchExchangeKeys,
  });

  // 특정 거래소 키 조회
  const getExchangeKey = (exchangeName: string) => {
    return exchangeKeys?.[exchangeName] || null;
  };

  // 거래소 키 저장
  const { mutate: setExchangeKeyMutation } = useMutation({
    mutationFn: ({
      exchangeName,
      keys,
    }: {
      exchangeName: string;
      keys: ExchangeKey;
    }) => setExchangeKey(exchangeName, keys),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exchangeKeys"] });
    },
  });

  // 모든 거래소 키 삭제
  const deleteAllExchangeKeys = async (): Promise<boolean> => {
    try {
      await chrome.storage.local.set({ exchangeKeys: {} });
      return true;
    } catch (error) {
      console.error("Failed to delete all exchange keys:", error);
      return false;
    }
  };
  // 거래소 키 삭제
  const { mutate: deleteExchangeKeyMutation } = useMutation({
    mutationFn: (exchangeName: string) => deleteExchangeKey(exchangeName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exchangeKeys"] });
    },
  });

  // 모든 거래소 키 삭제
  const { mutate: deleteAllExchangeKeysMutation } = useMutation({
    mutationFn: deleteAllExchangeKeys,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exchangeKeys"] });
    },
  });

  return {
    exchangeKeys,
    isLoading,
    getExchangeKey,
    setExchangeKey: setExchangeKeyMutation,
    deleteExchangeKey: deleteExchangeKeyMutation,
    deleteAllExchangeKeys: deleteAllExchangeKeysMutation,
  };
}
