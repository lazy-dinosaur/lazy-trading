// 구글 애널리틱스에 보낼 이벤트 타입 정의
export interface AnalyticsEvent {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  [key: string]: any;
}

// 구글 애널리틱스 초기화 함수 (Manifest V3 호환 버전)
export const initAnalytics = (measurementId: string) => {
  if (!measurementId) {
    console.warn('Analytics Measurement ID not provided. Analytics will not be initialized.');
    return;
  }

  // dataLayer와 gtag 함수를 직접 구현
  window.dataLayer = window.dataLayer || [];
  
  // gtag 함수 구현
  window.gtag = function(...args: any[]) {
    const command = args[0];
    
    if (command === 'config') {
      // GA4 초기화 설정
      console.info('Analytics initialized with ID:', measurementId);
    } else if (command === 'event') {
      // 이벤트 전송 로직
      const eventName = args[1];
      const eventParams = args[2] || {};
      
      // 측정 프로토콜로 이벤트 전송 (개발 환경에서는 로그만 출력)
      if (process.env.NODE_ENV === 'development') {
        console.log('GA4 Event:', eventName, eventParams);
      } else {
        // 프로덕션 환경에서는 실제 이벤트 전송
        sendEventToGA4(measurementId, eventName, eventParams);
      }
    }
    
    // dataLayer에 기록
    window.dataLayer.push(args);
  };
  
  // 초기 설정
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: false,
  });
};

// GA4 측정 프로토콜을 사용하여 이벤트 직접 전송
const sendEventToGA4 = async (measurementId: string, eventName: string, params: any) => {
  try {
    // 클라이언트 ID 가져오기
    const clientId = await getClientId();
    
    // GA4 측정 프로토콜 엔드포인트
    const apiSecret = import.meta.env.VITE_GA_API_SECRET;
    const endpoint = `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`;
    
    // 이벤트 데이터 구성
    const eventData = {
      client_id: clientId,
      events: [{
        name: eventName,
        params: {
          ...params,
          engagement_time_msec: 100,
        }
      }]
    };
    
    // 네트워크 요청 전송
    fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(eventData),
    }).catch(e => console.error('Error sending GA event:', e));
  } catch (e) {
    console.error('Error in sendEventToGA4:', e);
  }
};

// 클라이언트 ID 가져오기 (또는 생성)
const getClientId = async () => {
  try {
    const storage = await chrome.storage.local.get(['ga_client_id']);
    if (storage.ga_client_id) {
      return storage.ga_client_id;
    }
    
    const newClientId = `GA1.1.${Math.floor(Math.random() * 1000000000)}.${Math.floor(Date.now() / 1000)}`;
    await chrome.storage.local.set({ ga_client_id: newClientId });
    return newClientId;
  } catch (e) {
    console.error('Error getting/setting client ID:', e);
    return `GA1.1.${Math.floor(Math.random() * 1000000000)}.${Math.floor(Date.now() / 1000)}`;
  }
};

// 페이지 뷰 추적
export const trackPageView = (pagePath: string, pageTitle?: string) => {
  if (!window.gtag) return;
  
  window.gtag('event', 'page_view', {
    page_path: pagePath,
    page_title: pageTitle || document.title,
    page_location: chrome.runtime.getURL(pagePath),
  });
};

// 이벤트 추적
export const trackEvent = ({ action, category, label, value, ...rest }: AnalyticsEvent) => {
  if (!window.gtag) return;

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value,
    ...rest,
  });
};

// 사용자 속성 설정
export const setUserProperty = (name: string, value: string) => {
  if (!window.gtag) return;

  window.gtag('set', 'user_properties', {
    [name]: value,
  });
};

// TypeScript 타입 정의 확장
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}
