import { useQuery } from "@tanstack/react-query";
import { BalanceHistory, LedgerEntryInfo } from "@/lib/balance-history";
import { DecryptedAccount, calculateUSDBalance } from "@/lib/accounts"; // calculateUSDBalance import 추가

// 차트용 데이터 인터페이스
export interface ChartData {
  time: string; // 'YYYY-MM-DD' format for daily or 'YYYY-MM-DD HH:MM' for hourly
  value: number; // 스테이블 코인 총 잔고
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

    console.log( // console.log 추가
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

// 각 계정의 현재 총 자산 USD 가치 가져오기 (calculateUSDBalance 활용)
export const fetchAccountCurrentTotalBalance = async (
  account: DecryptedAccount,
): Promise<number> => {
  // calculateUSDBalance 함수를 재사용하기 위해 임시로 fetchBalance 호출
  // 실제로는 useAccountsBalance 훅의 결과를 사용하는 것이 더 효율적이지만,
  // useBalanceHistory 훅 내부에서 직접 계산하기 위해 이 방식을 사용합니다.
  try {
    console.log(`[DEBUG] ${account.exchange} 현재 총 자산 USD 가치 조회 시작`);
    const exchange = account.exchangeInstance.ccxt;
    const rawBalance = await exchange.fetchBalance();
    // calculateUSDBalance 함수는 src/lib/accounts.ts 에 정의되어 있어야 함
    // 해당 함수를 import 하거나, 로직을 여기에 직접 구현해야 합니다.
    // 여기서는 calculateUSDBalance가 import 되었다고 가정합니다.
    // import { calculateUSDBalance } from "@/lib/accounts"; // 이 import가 필요
    const usdBalance = await calculateUSDBalance(exchange, rawBalance); // calculateUSDBalance 호출
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

// 시뮬레이션 함수 제거됨


// 총 자산 USD 가치 기준으로 일별 잔고 계산
export const calculateDailyBalance = async (
  decryptedAccounts: Record<string, DecryptedAccount>,
  days: number = 7,
): Promise<BalanceHistory[]> => {
  try {
    console.log(
      `[DEBUG] (총 자산 USD 기반) 일별 잔고 계산 시작 - 계정 수: ${Object.keys(decryptedAccounts).length}`,
    );

    // 모든 계정의 스테이블 코인 원장 데이터 병렬 수집
    const ledgerPromises = Object.values(decryptedAccounts).map(account =>
      fetchAccountLedger(account, days)
    );
    const allLedgersArrays = await Promise.all(ledgerPromises);
    const allLedgers = allLedgersArrays.flat();

    console.log(
      `[DEBUG] 모든 계정 원장 데이터 수집 및 처리 완료, 총 ${allLedgers.length}건`,
    );

    // 날짜별 USD 가치 변화량 합산 (usdValue 사용)
    const dailyChanges: Record<string, number> = {};
    for (const entry of allLedgers) {
      // usdValue가 유효한 숫자일 경우에만 합산
      if (entry.datetime && typeof entry.usdValue === 'number' && !isNaN(entry.usdValue)) {
         const date = entry.datetime.split("T")[0]; // 'YYYY-MM-DD'
         dailyChanges[date] = (dailyChanges[date] || 0) + entry.usdValue;
      }
    }

    console.log("[DEBUG] 날짜별 USD 가치 변화량 계산 완료", dailyChanges);

    // 현재 총 자산 USD 가치 병렬 계산
    const balancePromises = Object.values(decryptedAccounts).map(account =>
        fetchAccountCurrentTotalBalance(account) // 수정된 함수 호출
    );
    const currentBalances = await Promise.all(balancePromises);
    const currentTotalBalance = currentBalances.reduce((sum, balance) => sum + balance, 0);


    console.log(`[DEBUG] 현재 총 자산 USD 가치: ${currentTotalBalance}`);

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
    let currentBalance = currentTotalBalance; // 현재 총 자산 USD 가치로 시작

    for (let i = dates.length - 1; i >= 0; i--) {
      const date = dates[i];
      const change = dailyChanges[date] || 0; // 해당 날짜의 USD 가치 변화량
      history.unshift({
        date,
        total: Math.round(currentBalance * 100) / 100, // 현재 날짜의 추정 총 자산 기록
      });
      // 다음 과거 날짜의 잔고를 계산하기 위해 변화량을 <0xC2><0xA0>뺌 (역산)
      currentBalance -= change;
    }

    console.log("[DEBUG] 최종 일별 총 자산 USD 가치 변동 계산 완료", history);

    return history;
  } catch (error) {
    console.error(`[DEBUG] (총 자산 USD 기반) 일별 잔고 계산 실패:`, error);
    // 실패 시 빈 배열 반환 (시뮬레이션 데이터 제거)
    return [];
  }
};

// 총 자산 USD 가치 기준 잔고 내역 조회 훅
export const useBalanceHistory = (
  decryptedAccounts: Record<string, DecryptedAccount> | undefined,
) => {
  // calculateUSDBalance 함수 import 확인 필요
  // import { calculateUSDBalance } from "@/lib/accounts";

  return useQuery<BalanceHistory[], Error>({ // 에러 타입 명시
    queryKey: ["balanceHistory", decryptedAccounts], // 쿼리 키 복원
    queryFn: async () => {
      if (!decryptedAccounts || Object.keys(decryptedAccounts).length === 0) {
        console.log(`[DEBUG] 복호화된 계정 정보 없음, 빈 배열 반환`);
        return [];
      }

      console.log(
        `[DEBUG] 일별 총 자산 USD 변동 내역 조회 시작 - 계정 수: ${Object.keys(decryptedAccounts).length}`,
      );

      // 총 자산 USD 기준으로 과거 7일간의 잔고 추이 계산
      const result = await calculateDailyBalance(decryptedAccounts);

      console.log(
        `[DEBUG] 일별 총 자산 USD 변동 내역 조회 완료 - 데이터 포인트 수: ${result.length}`,
      );

      return result;
    },
    enabled:
      !!decryptedAccounts && Object.keys(decryptedAccounts || {}).length > 0,
    staleTime: 1000 * 60 * 5, // 5분간 데이터 신선 유지
    refetchInterval: 1000 * 60 * 5, // 5분마다 자동 갱신
  });
};

export const balanceHistoryToChartData = (
  history: BalanceHistory[],
): ChartData[] => {
  // history가 비어있거나 유효하지 않은 경우 빈 배열 반환
  if (!Array.isArray(history) || history.length === 0) {
    console.log(`[DEBUG] 변환할 잔고 내역 데이터 없음, 빈 차트 데이터 반환`);
    return [];
  }

  const chartData = history.map((item) => ({
    time: item.date, // YYYY-MM-DD 형식
    value: item.total, // 해당 날짜의 추정 총 자산 USD 가치
  }));

  console.log(`[DEBUG] 총 자산 USD 잔고 내역 차트 데이터 변환 완료:`, chartData);

  return chartData;
};
