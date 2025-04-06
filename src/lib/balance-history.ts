// 일별 잔고 기록
export interface BalanceHistory {
  date: string; // ISO 문자열 형식의 날짜 (YYYY-MM-DD)
  timestamp?: number; // 타임스탬프 추가
  total?: number; // 이전 버전과의 호환성을 위해 유지
  balance?: number; // 새로운 계정별 잔고 필드
  time?: string; // 차트 컴포넌트 호환용 시간 필드 (YYYY-MM-DD)
  value?: number; // 차트 컴포넌트 호환용 값 필드 (balance 값과 동일)
}

// 거래소별 원장 데이터 정보 인터페이스
export interface LedgerEntryInfo {
  id: string;
  timestamp: number;
  datetime: string;
  amount: number;
  currency: string;
  usdValue: number; // USD 가치
  type?: string;
  info?: any; // 원본 데이터 저장용
}

// 거래소별 원장 데이터
export interface ExchangeLedgerData {
  [exchangeId: string]: LedgerEntryInfo[];
}

// 일자별 자산 요약 데이터
export interface DailyBalanceSummary {
  [date: string]: {
    total: number;
    details: {
      [exchangeId: string]: number;
    };
  };
}

// 이전 버전과의 호환성을 위한 함수
export const saveBalanceHistory = async (total: number): Promise<void> => {
  console.log(total);
  // CCXT를 사용하는 새 구현에서는 이 함수가 필요 없지만,
  // 기존 코드와의 호환성을 위해 빈 함수로 유지합니다.
  console.log("DEPRECATED: saveBalanceHistory는 더 이상 사용되지 않습니다.");
};
