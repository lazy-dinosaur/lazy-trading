import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
