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
  id: string;           // 원장 항목의 고유 ID
  timestamp: number;    // 타임스탬프 (밀리초)
  datetime: string;     // ISO8601 형식의 날짜/시간 문자열
  amount: number;       // 금액 (절대값, 수수료 미포함)
  currency: string;     // 통화 코드 (예: 'BTC', 'ETH', 'USDT')
  usdValue: number;     // 계산된 USD 가치
  type?: string;        // 항목 유형 (예: 'deposit', 'withdrawal', 'trade')
  direction?: string;   // 'in' 또는 'out'
  account?: string;     // 계정 ID
  referenceId?: string; // 거래 참조 ID
  referenceAccount?: string; // 반대 계정 ID
  before?: number;      // 이전 잔고
  after?: number;       // 이후 잔고
  status?: string;      // 상태 ('ok', 'pending', 'canceled')
  fee?: {               // 수수료 정보
    cost: number;       // 수수료 비용
    currency: string;   // 수수료 통화
  };
  info?: any;           // 원본 거래소 데이터
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
