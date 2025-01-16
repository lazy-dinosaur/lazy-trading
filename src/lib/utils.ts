import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const getSymbol = (coin: string, base: string) => `${coin}/${base}`;

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

// 사이드 패널이 열려있는지 확인
export const isSidePanelOpen = async (): Promise<boolean> => {
  try {
    // 현재 활성화된 탭의 windowId를 가져옴
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab?.windowId) return false;

    // 해당 window의 모든 view를 가져와서 사이드패널이 있는지 확인
    const views = chrome.extension.getViews({
      type: "popup",
      windowId: tab.windowId,
    });

    return !(views.length > 0);
  } catch (error) {
    console.error("Failed to check side panel state:", error);
    return false;
  }
};

// 사이드 패널 열기
export const openSidePanel = async () => {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const views = chrome.extension.getViews({
      type: "popup",
      windowId: tab.windowId,
    });
    if (tab?.id && views.length > 0) {
      await chrome.sidePanel.open({ windowId: tab.windowId });
      // 팝업 창 닫기
      window.close();
    }
  } catch (error) {
    console.error("Failed to open side panel:", error);
  }
};

export const openPopupPanel = async () => {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    const views = chrome.extension.getViews({
      type: "popup",
      windowId: tab.windowId,
    });
    if (tab?.id && views.length == 0) {
      await chrome.action.openPopup({ windowId: tab.windowId });
      // 팝업 창 닫기
      // window.close();
    }
  } catch (error) {
    console.error("Failed to open side panel:", error);
  }
};
