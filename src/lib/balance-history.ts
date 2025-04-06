// 일별 잔고 기록 (스테이블 코인 기준)
export interface BalanceHistory {
  date: string; // ISO 문자열 형식의 날짜 (YYYY-MM-DD)
  total: number; // 해당 날짜의 추정 스테이블 코인 총 잔고 (USD 가치와 거의 동일)
}

// 거래소별 원장 데이터 정보 인터페이스 (스테이블 코인 거래 위주)
export interface LedgerEntryInfo {
  id: string;
  timestamp: number;
  datetime: string;
  amount: number; // 스테이블 코인의 경우, 해당 코인의 양 변화
  currency: string;
  usdValue?: number; // 이 필드는 더 이상 정확한 계산에 사용되지 않음 (스테이블 코인 기준)
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

// 이전 버전과의 호환성을 위한 함수 (더 이상 사용하지 않음)
export const saveBalanceHistory = async (total: number): Promise<void> => {
  console.log(total);
  // CCXT를 사용하는 새 구현에서는 이 함수가 필요 없지만,
  // 기존 코드와의 호환성을 위해 빈 함수로 유지합니다.
  console.log("DEPRECATED: saveBalanceHistory는 더 이상 사용되지 않습니다.");
};
