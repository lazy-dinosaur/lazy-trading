// 구글 애널리틱스 설정
export const ANALYTICS_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';
export const ANALYTICS_API_SECRET = import.meta.env.VITE_GA_API_SECRET || '';

// 애널리틱스 활성화 여부 (개발 중에는 비활성화 가능)
export const ANALYTICS_ENABLED = import.meta.env.MODE === 'production' || true; // 개발 중에도 테스트할 수 있도록 true로 설정

// 측정 프로토콜 사용 여부 (Manifest V3 대응)
export const USE_MEASUREMENT_PROTOCOL = true;
