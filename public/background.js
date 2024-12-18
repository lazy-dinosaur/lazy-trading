let pinNumber = null;
let started = false;

// 팝업과 통신하기 위한 메시지 리스너
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
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
