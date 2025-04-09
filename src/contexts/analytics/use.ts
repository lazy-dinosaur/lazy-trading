import { useContext, useCallback } from 'react';
import { AnalyticsContext } from './context';
import { 
  trackEvent as originalTrackEvent, 
  setUserProperty as originalSetUserProperty, 
  trackPageView as originalTrackPageView,
  AnalyticsEvent
} from '@/lib/analytics';
import { ANALYTICS_ENABLED } from '@/lib/analytics/config';

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  
  // 이벤트 추적 함수 (메모이제이션 적용)
  const trackEvent = useCallback((event: AnalyticsEvent) => {
    if (!ANALYTICS_ENABLED || !context.isInitialized) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics] Event tracked (disabled):', event);
      }
      return;
    }
    
    // 개발 환경에서는 콘솔에 이벤트 로깅
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] Event tracked:', event);
    }
    
    // 실제 이벤트 추적
    originalTrackEvent(event);
  }, [context.isInitialized]);
  
  // 페이지 뷰 추적 함수
  const trackPageView = useCallback((pagePath: string, pageTitle?: string) => {
    if (!ANALYTICS_ENABLED || !context.isInitialized) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics] Page view tracked (disabled):', pagePath, pageTitle);
      }
      return;
    }
    
    // 개발 환경에서는 콘솔에 페이지뷰 로깅
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] Page view tracked:', pagePath, pageTitle);
    }
    
    // 실제 페이지뷰 추적
    originalTrackPageView(pagePath, pageTitle);
  }, [context.isInitialized]);
  
  // 사용자 속성 설정 함수
  const setUserProperty = useCallback((name: string, value: string) => {
    if (!ANALYTICS_ENABLED || !context.isInitialized) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics] User property set (disabled):', name, value);
      }
      return;
    }
    
    // 개발 환경에서는 콘솔에 사용자 속성 로깅
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] User property set:', name, value);
    }
    
    // 실제 사용자 속성 설정
    originalSetUserProperty(name, value);
  }, [context.isInitialized]);
  
  return {
    ...context,
    trackEvent,
    trackPageView,
    setUserProperty,
  };
};
