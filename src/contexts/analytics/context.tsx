import { createContext, useEffect, useState } from 'react';
import { initAnalytics } from '@/lib/analytics';
import { ANALYTICS_ID, ANALYTICS_ENABLED } from '@/lib/analytics/config';

// 애널리틱스 컨텍스트 인터페이스
interface AnalyticsContextType {
  isInitialized: boolean;
}

// 기본값으로 애널리틱스 컨텍스트 생성
export const AnalyticsContext = createContext<AnalyticsContextType>({
  isInitialized: false,
});

export const AnalyticsProvider = ({ children }: { children: React.ReactNode }) => {
  const [isInitialized, setIsInitialized] = useState(false);

  // 애널리틱스 초기화
  useEffect(() => {
    if (!ANALYTICS_ENABLED) {
      console.info('Analytics is disabled in this environment.');
      return;
    }

    if (!ANALYTICS_ID) {
      console.warn('Analytics Measurement ID not provided. Analytics will not be initialized.');
      return;
    }

    try {
      initAnalytics(ANALYTICS_ID);
      setIsInitialized(true);
      console.info('Google Analytics initialized successfully.');
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
    }
  }, []);

  return (
    <AnalyticsContext.Provider value={{ isInitialized }}>
      {children}
    </AnalyticsContext.Provider>
  );
};
