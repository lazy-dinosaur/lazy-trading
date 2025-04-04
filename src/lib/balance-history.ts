// 자본 변동 데이터를 위한 인터페이스
export interface BalanceHistory {
  date: string; // ISO 문자열 형식의 날짜 (YYYY-MM-DD)
  total: number; // USD 총액
}

// 거래소별 원장 데이터 정보 인터페이스
export interface LedgerEntryInfo {
  id: string;
  timestamp: number;
  datetime: string;
  amount: number;
  currency: string;
  usdValue?: number;
  type?: string;
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
