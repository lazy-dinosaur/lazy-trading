import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { useAnalytics } from '@/contexts/analytics/use';

export const LocationListener = () => {
  const location = useLocation();
  const { trackPageView, isInitialized } = useAnalytics();

  // 페이지 뷰 추적
  useEffect(() => {
    if (isInitialized) {
      trackPageView(location.pathname);
    }
  }, [location, isInitialized, trackPageView]);

  // 이 컴포넌트는 UI를 렌더링하지 않습니다
  return null;
};
