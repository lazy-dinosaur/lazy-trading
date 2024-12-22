// 쿼리 키 상수
export const APP_STATE_KEY = ["appState"];

// 백그라운드와 통신하는 함수들
export interface AppState {
  currentRoute: string | null;
  data: Record<string, any>;
}

export const getAppState = async (): Promise<AppState> => {
  const response = await chrome.runtime.sendMessage({
    type: "GET_APP_STATE",
  });
  return response?.data ?? { currentRoute: null, data: {} };
};

export const updateAppState = async (state: Partial<AppState>) => {
  const response = await chrome.runtime.sendMessage({
    type: "UPDATE_APP_STATE",
    state: {
      currentRoute: state.currentRoute ?? null,
      data: state.data ?? {},
    },
  });
  return response.data;
};
