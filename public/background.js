// 초기 상태 정의
const initialState = {
  currentRoute: null,
  data: {},
};

let pinNumber = null;
let started = false;
let appState = { ...initialState };

// 팝업과 통신하기 위한 메시지 리스너
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "GET_APP_STATE":
      sendResponse({
        data: {
          currentRoute: appState.currentRoute,
          data: appState.data || {},
        },
      });
      break;

    case "UPDATE_APP_STATE":
      // state가 undefined인 경우 처리
      const newState = message.state || {};

      // currentRoute가 변경되면 data 초기화
      if (
        newState.currentRoute &&
        newState.currentRoute !== appState.currentRoute
      ) {
        appState = {
          currentRoute: newState.currentRoute,
          data: {},
        };
      } else {
        appState = {
          currentRoute: newState.currentRoute || appState.currentRoute,
          data: { ...appState.data, ...(newState.data || {}) },
        };
      }

      sendResponse({ data: appState });
      break;

    case "SET_PIN":
      pinNumber = message.pin;
      sendResponse({ success: true });
      break;

    case "GET_PIN":
      sendResponse({ pin: pinNumber });
      break;

    case "GET_STARTED":
      sendResponse({ started });
      break;

    case "SET_STARTED":
      started = message.value;
      sendResponse({ started });
      break;

    default:
      sendResponse({ error: "Unknown message type" });
  }
  return true; // 비동기 응답을 위해 true 반환
});

// 확장프로그램이 설치/업데이트될 때 상태 초기화
chrome.runtime.onInstalled.addListener(() => {
  appState = { ...initialState };
});
