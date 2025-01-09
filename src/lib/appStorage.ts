export type TradingConfigType = {
  risk: number;
};

export const setTradingConfig = async (
  setting: TradingConfigType,
): Promise<void> => {
  try {
    await chrome.storage.local.set({ tradingSetting: setting });
  } catch (error) {
    console.error("Failed to set pinCreated in storage:", error);
    throw error;
  }
};

export const getTradingConfig = async (): Promise<TradingConfigType | null> => {
  try {
    const result = await chrome.storage.local.get(["tradingSetting"]);

    return result.tradingSetting ?? null;
  } catch (error) {
    console.error("Failed to get pinCreated from storage:", error);
    throw error; // React Query가 에러를 처리할 수 있도록 throw
  }
};
