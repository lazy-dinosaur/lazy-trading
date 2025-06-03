//pin
import { VERIFICATION_STRING } from "@/contexts/pin/type";
import { decryptKey, EncryptedData, encryptKey } from "./cryptography";

export const fetchPinCreated = async () => {
  const result = await chrome.storage.local.get(["encryptedPin"]);
  return !!result.encryptedPin;
};
export const setPin = async (pin: string) => {
  if (!pin) {
    console.warn("PIN is not set");
    return null;
  }
  try {
    const encryptedPin = await encryptKey(VERIFICATION_STRING, pin);
    console.log("Encrypted PIN:", encryptedPin);

    await chrome.storage.local.set({ encryptedPin });
    await chrome.storage.session.set({ pin });

    return { success: true, pin };
  } catch (error) {
    console.error(`Failed to encryptPin:`, error);
    return null;
  }
};

export const fetchEncryptedPin = async () => {
  const result = await chrome.storage.local.get(["encryptedPin"]);
  return result.encryptedPin;
};
export const checkPinValid = async ({
  encryptedPin,
  pin,
}: {
  encryptedPin: EncryptedData;
  pin: string;
}) => {
  if (!pin) {
    console.warn("PIN is not set");
    return null;
  }
  try {
    const decryptedPin = await decryptKey(encryptedPin, pin);
    if (decryptedPin === VERIFICATION_STRING) {
      return { success: true, pin };
    }
    throw new Error("Invalid PIN");
  } catch (error) {
    console.error("Failed to decrypt PIN:", error);
    return null;
  }
};

//trading config
export type TradingConfigType = {
  risk: number;
  riskRatio: number;
  partialClose: boolean;
  closeRatio: number;
  stopToEven: boolean;
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
