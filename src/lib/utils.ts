import { TimeFrameType } from "@/components/trade/time-frame";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const setPin = async (pin: string): Promise<boolean> => {
  try {
    const response = await chrome.runtime.sendMessage({
      type: "SET_PIN",
      pin,
    });
    return response.success;
  } catch (error) {
    console.error("Failed to set PIN:", error);
    return false;
  }
};

export const getPin = async (): Promise<string | null> => {
  try {
    const response = await chrome.runtime.sendMessage({
      type: "GET_PIN",
    });
    return response.pin;
  } catch (error) {
    console.error("Failed to get PIN:", error);
    return null;
  }
};

interface LocalStorage {
  pinCreated?: boolean;
}

export const fetchPinCreated = async (): Promise<boolean> => {
  try {
    const result = (await chrome.storage.local.get([
      "pinCreated",
    ])) as LocalStorage;
    return result.pinCreated ?? false;
  } catch (error) {
    console.error("Failed to get pinCreated from storage:", error);
    throw error; // React Query가 에러를 처리할 수 있도록 throw
  }
};

export const setPinCreated = async (value: boolean): Promise<void> => {
  try {
    await chrome.storage.local.set({ pinCreated: value });
  } catch (error) {
    console.error("Failed to set pinCreated in storage:", error);
    throw error;
  }
};

export const getStarted = async (): Promise<boolean> => {
  try {
    const response = await chrome.runtime.sendMessage({ type: "GET_STARTED" });
    return response.started;
  } catch (error) {
    console.error("Failed to get started from service worker:", error);
    return false;
  }
};

export const setStarted = async (value: boolean): Promise<boolean> => {
  try {
    const response = await chrome.runtime.sendMessage({
      type: "SET_STARTED",
      value,
    });
    return response.started;
  } catch (error) {
    console.error("Failed to set started in service worker:", error);
    return false;
  }
};
export const formatTime = (timestamp: number, timeFrame: TimeFrameType) => {
  const date = new Date(timestamp * 1000);

  switch (timeFrame) {
    case "5":
    case "15":
    case "30":
    case "60":
    case "240":
      // 분봉, 시간봉은 날짜와 시간 모두 표시
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hour: date.getHours(),
        minute: date.getMinutes(),
      };

    case "D":
    case "W":
    case "M":
      // 일봉, 주봉, 월봉은 날짜만 표시
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
      };

    default:
      return date.toISOString().split("T")[0];
  }
};
