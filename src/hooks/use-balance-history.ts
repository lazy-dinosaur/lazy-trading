import { useQuery } from "@tanstack/react-query";
import { BalanceHistory, LedgerEntryInfo } from "@/lib/balance-history";
import { DecryptedAccount, calculateUSDBalance } from "@/lib/accounts";
import { useAccounts } from "@/contexts/accounts/use";

// 차트용 데이터 인터페이스 통일 (모든 컴포넌트에서 같은 방식으로 사용하도록)
export interface ChartData {
  time: string; // 'YYYY-MM-DD' format
  value: number; // USD 총 잔고
}

// 주요 스테이블 코인 목록 (소문자로 비교)
const STABLE_COINS = ["usdt", "usdc", "busd", "dai", "tusd", "usdp", "fdusd"];

// CCXT를 사용하여 계정의 전체 원장 내역 및 USD 가치 추정치 가져오기
export const fetchAccountLedger = async (
  account: DecryptedAccount,
  days: number = 7,
): Promise<LedgerEntryInfo[]> => {
  try {
    console.log(`[DEBUG] ${account.exchange} 전체 원장 데이터 조회 시작`);

    // 시작 시간 계산 (현재 시간에서 지정된 일수만큼 이전)
    const now = new Date();
    const startTime = new Date();
    startTime.setDate(now.getDate() - days);

    // CCXT fetchLedger 호출
    const exchange = account.exchangeInstance.ccxt;

    // 필터링 및 페이징 옵션
    const since = startTime.getTime();
    const limit = 1000; // 충분히 큰 값으로 설정

    // 거래소별로 다른 파라미터 처리
    let params = {};

    if (account.exchange === "bybit") {
      params = { accountType: "UNIFIED" };
    } else if (account.exchange === "binance") {
      params = { recvWindow: 60000 };
    }

    console.log(
      `[DEBUG] ${account.exchange} fetchLedger 호출 - since: ${new Date(since).toISOString()}, limit: ${limit}`,
    );

    // 원장 데이터 조회
    const ledger = await exchange.fetchLedger(undefined, since, limit, params);
    console.log(
      `[DEBUG] ${account.exchange} 전체 원장 데이터 조회 성공 - 항목 수: ${ledger.length}`,
    );

    // 각 원장 항목의 USD 가치 추정 (현재 시세 기준)
    const processedLedger = await Promise.all(
      ledger.map(async (entry: any): Promise<LedgerEntryInfo | null> => {
        // amount나 currency 정보가 없으면 처리 불가
        if (entry.amount === undefined || !entry.currency) {
          return null;
        }

        let usdValue = 0;
        const currencyCode = entry.currency.toLowerCase();
        const amount = Number(entry.amount) || 0;

        try {
          // 스테이블 코인인 경우 amount를 USD 가치로 간주 (부호 유지)
          if (STABLE_COINS.includes(currencyCode)) {
            usdValue = amount;
          }
          // 다른 코인은 현재 USDT 시세로 계산 시도
          else {
            const tickerSymbol = `${entry.currency.toUpperCase()}/USDT`;
            try {
              const ticker = await exchange.fetchTicker(tickerSymbol);
              const price = ticker.last || 0;
              usdValue = amount * price; // 부호 유지
              console.log(`[DEBUG] ${account.exchange} ${tickerSymbol} 시세 조회: ${price}, 계산된 USD 가치: ${usdValue}`);
            } catch (tickerError) {
              // USDT 페어가 없는 경우 등 예외 처리
              console.warn(`[DEBUG] ${account.exchange} ${tickerSymbol} 시세 조회 실패, USD 가치 0으로 처리:`, tickerError);
              usdValue = 0; // 시세 조회 실패 시 0으로 처리
            }
          }
        } catch (calcError) {
          console.error(`[DEBUG] ${account.exchange} ${entry.currency} USD 가치 계산 중 오류:`, calcError);
          usdValue = 0; // 계산 오류 시 0으로 처리
        }

        return {
          id: entry.id,
          timestamp: entry.timestamp,
          datetime: entry.datetime,
          amount: amount,
          currency: entry.currency,
          usdValue: usdValue, // 계산된 USD 가치 (부호 포함)
          type: entry.type,
          info: entry.info,
        };
      }),
    );

    // null 항목 제거 및 유효한 항목만 반환
    const validLedgerEntries = processedLedger.filter(entry => entry !== null) as LedgerEntryInfo[];

    console.log(
      `[DEBUG] ${account.exchange} 원장 데이터 USD 가치 계산 완료 - 유효 항목 수: ${validLedgerEntries.length}`,
    );

    if (validLedgerEntries.length > 0) {
      console.log(
        `[DEBUG] ${account.exchange} 처리된 원장 첫 항목:`,
        validLedgerEntries[0],
      );
    }

    return validLedgerEntries;
  } catch (error) {
    console.error(
      `[DEBUG] ${account.exchange} 계정의 전체 원장 데이터 조회 또는 처리 실패:`,
      error,
    );
    return [];
  }
};

// 계정의 현재 총 자산 USD 가치 가져오기
export const fetchAccountCurrentTotalBalance = async (
  account: DecryptedAccount,
): Promise<number> => {
  try {
    console.log(`[DEBUG] ${account.exchange} 현재 총 자산 USD 가치 조회 시작`);
    const exchange = account.exchangeInstance.ccxt;
    const rawBalance = await exchange.fetchBalance();
    const usdBalance = await calculateUSDBalance(exchange, rawBalance);
    console.log(
      `[DEBUG] ${account.exchange} 현재 총 자산 USD 가치 조회 완료: ${usdBalance.total}`,
    );
    return usdBalance.total; // 총 USD 가치 반환
  } catch (error) {
    console.error(
      `[DEBUG] ${account.exchange} 계정의 현재 총 자산 USD 가치 조회 실패:`,
      error,
    );
    return 0; // 실패 시 0 반환
  }
};

// calculateAccountBalanceHistory 함수 개선
export const calculateAccountBalanceHistory = async (
  account: DecryptedAccount,
  days: number = 7 // 7일로 기본값 변경 (대시보드와 통일)
): Promise<BalanceHistory[]> => {
  try {
    console.log(`[DEBUG] ${account.exchange} 일별 잔고 계산 시작`);

    // 계정의 원장 데이터 수집
    const ledgerEntries = await fetchAccountLedger(account, days);

    console.log(
      `[DEBUG] ${account.exchange} 원장 데이터 수집 및 처리 완료, 총 ${ledgerEntries.length}건`,
    );

    // 날짜별 USD 가치 변화량 합산
    const dailyChanges: Record<string, number> = {};
    for (const entry of ledgerEntries) {
      if (entry.datetime && typeof entry.usdValue === 'number' && !isNaN(entry.usdValue)) {
         const date = entry.datetime.split("T")[0]; // 'YYYY-MM-DD'
         dailyChanges[date] = (dailyChanges[date] || 0) + entry.usdValue;
      }
    }

    console.log(`[DEBUG] ${account.exchange} 날짜별 USD 가치 변화량 계산 완료`, dailyChanges);

    // 현재 계정의 총 자산 USD 가치 계산
    const currentBalance = await fetchAccountCurrentTotalBalance(account);
    console.log(`[DEBUG] ${account.exchange} 현재 총 자산 USD 가치: ${currentBalance}`);

    // 지정된 일수만큼 날짜 배열 생성 (과거 → 현재 순서)
    const dates: string[] = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(d.toISOString().split("T")[0]);
    }

    // 누적 잔고 계산 (현재 총 자산 USD 가치에서 과거 변화량을 빼면서 역산)
    const history: BalanceHistory[] = [];
    let balance = currentBalance; // 현재 총 자산 USD 가치로 시작

    // 마지막 날짜(오늘)부터 시작하여 과거로 거슬러 올라가며 계산
    for (let i = dates.length - 1; i >= 0; i--) {
      const date = dates[i];
      const timestamp = new Date(date).getTime();
      
      // 일별 변화량 적용 (오늘 날짜는 제외 - 현재 잔고 사용)
      if (i < dates.length - 1) {
        const change = dailyChanges[date] || 0;
        balance -= change;
      }
      
      // 음수 방지 및 소수점 2자리까지 반올림
      const safeBalance = Math.max(0, Math.round(balance * 100) / 100);
      
      // 과거 날짜부터 정렬되도록 앞에 추가
      history.unshift({
        date,
        timestamp,
        balance: safeBalance,
        // 추가: time과 value 필드를 명시적으로 포함하여 차트 컴포넌트와 호환성 개선
        time: date,
        value: safeBalance
      });
    }

    console.log(`[DEBUG] ${account.exchange} 최종 일별 총 자산 USD 가치 변동 계산 완료`, history);

    return history;
  } catch (error) {
    console.error(`[DEBUG] ${account.exchange} 일별 잔고 계산 실패:`, error);
    return generateDummyBalanceHistory(days); // 실패 시 더미 데이터 생성
  }
};

// 더미 데이터 생성 함수 개선 (time과 value 필드 추가)
const generateDummyBalanceHistory = (days: number = 7): BalanceHistory[] => {
  console.log(`[DEBUG] 더미 잔고 내역 데이터 생성 (${days}일)`);
  
  const history: BalanceHistory[] = [];
  const today = new Date();
  const baseValue = Math.random() * 500 + 500; // 500-1000 사이의 기본값
  
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const date = d.toISOString().split("T")[0];
    const timestamp = d.getTime();
    
    // 약간의 변동성을 가진 잔고 생성
    const randomFactor = 0.95 + (Math.random() * 0.1); // 0.95-1.05 사이의 변동 요소
    const balance = Math.round((baseValue * Math.pow(1.01, days - i) * randomFactor) * 100) / 100;
    
    history.push({
      date,
      timestamp,
      balance,
      // 추가: time과 value 필드를 명시적으로 포함
      time: date,
      value: balance
    });
  }
  
  return history;
};

// calculateAllAccountsBalanceHistory 함수 개선 (time과 value 필드 추가)
export const calculateAllAccountsBalanceHistory = async (
  decryptedAccounts: Record<string, DecryptedAccount>,
  days: number = 7 // 7일로 기본값 변경
): Promise<BalanceHistory[]> => {
  // 함수 내용은 이전과 유사하게 유지하되, 반환 객체에 time과 value 필드 추가
  try {
    console.log(`[DEBUG] 모든 계정의 일별 잔고 계산 시작`);
    
    // 각 계정별 잔고 내역 병렬 계산
    const accountPromises = Object.values(decryptedAccounts).map(account =>
      calculateAccountBalanceHistory(account, days)
    );
    
    const allAccountHistories = await Promise.all(accountPromises);
    
    // 모든 계정의 일별 잔고 합산
    const combinedHistory: BalanceHistory[] = [];
    const dateMap: Record<string, number> = {};
    
    // 모든 계정의 내역을 순회하며 날짜별로 잔고 합산
    for (const accountHistory of allAccountHistories) {
      for (const entry of accountHistory) {
        if (!dateMap[entry.date]) {
          dateMap[entry.date] = 0;
        }
        dateMap[entry.date] += entry.balance || 0;
      }
    }
    
    // 날짜별 정렬 후 결과 생성
    const sortedDates = Object.keys(dateMap).sort();
    for (const date of sortedDates) {
      const balance = Math.round(dateMap[date] * 100) / 100;
      combinedHistory.push({
        date,
        timestamp: new Date(date).getTime(),
        balance,
        // 추가: time과 value 필드 명시적 포함
        time: date,
        value: balance
      });
    }
    
    console.log(`[DEBUG] 모든 계정의 일별 잔고 계산 완료 - 데이터 포인트 수: ${combinedHistory.length}`);
    
    return combinedHistory;
  } catch (error) {
    console.error(`[DEBUG] 모든 계정의 일별 잔고 계산 실패:`, error);
    return generateDummyBalanceHistory(days);
  }
};

// useBalanceHistory 훅 개선
export const useBalanceHistory = (accountId: string | undefined) => {
  const { decryptedAccounts } = useAccounts();
  
  return useQuery<BalanceHistory[], Error>({
    queryKey: ["accountBalanceHistory", accountId],
    queryFn: async () => {
      // 특별한 ID "all"이 주어진 경우 모든 계정의 합산 잔고 표시
      if (accountId === "all") {
        if (!decryptedAccounts || Object.keys(decryptedAccounts).length === 0) {
          console.log(`[DEBUG] 복호화된 계정 정보 없음, 더미 데이터 반환`);
          return generateDummyBalanceHistory();
        }
        
        return calculateAllAccountsBalanceHistory(decryptedAccounts);
      }
      
      // 특정 계정 ID가 주어진 경우
      if (!accountId || !decryptedAccounts || !decryptedAccounts[accountId]) {
        console.log(`[DEBUG] 계정 정보 없음, 더미 데이터 반환`);
        return generateDummyBalanceHistory();
      }

      const account = decryptedAccounts[accountId];
      console.log(`[DEBUG] ${account.exchange} ${account.name} 계정의 잔고 내역 조회 시작`);

      // 특정 계정의 잔고 변동 내역 계산
      const result = await calculateAccountBalanceHistory(account);

      console.log(
        `[DEBUG] ${account.exchange} ${account.name} 계정의 잔고 내역 조회 완료 - 데이터 포인트 수: ${result.length}`,
      );

      return result;
    },
    enabled: accountId === "all" ? 
      !!decryptedAccounts && Object.keys(decryptedAccounts).length > 0 : 
      !!accountId && !!decryptedAccounts && !!decryptedAccounts[accountId],
    staleTime: 1000 * 60 * 5, // 5분간 데이터 신선 유지
    refetchInterval: 1000 * 60 * 5, // 5분마다 자동 갱신
  });
};

// 차트용 데이터 변환 함수 추가 (기존 코드 호환성 유지)
export const balanceHistoryToChartData = (history: BalanceHistory[]): ChartData[] => {
  return history.map(item => ({
    time: item.date,
    value: item.balance || 0
  }));
};
