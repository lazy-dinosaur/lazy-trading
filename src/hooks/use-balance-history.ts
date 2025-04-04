import { useQuery } from "@tanstack/react-query";
import { BalanceHistory, LedgerEntryInfo } from "@/lib/balance-history";
import { DecryptedAccount } from "@/lib/accounts";

// 차트용 데이터 인터페이스
export interface ChartData {
  time: string; // 'YYYY-MM-DD' format for daily or 'YYYY-MM-DD HH:MM' for hourly
  value: number;
}

// CCXT를 사용하여 계정의 자본 변동 내역 가져오기
export const fetchAccountLedger = async (
  account: DecryptedAccount,
  days: number = 7,
): Promise<LedgerEntryInfo[]> => {
  try {
    console.log(`[DEBUG] ${account.exchange} 원장 데이터 조회 시작`);

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
      `[DEBUG] ${account.exchange} 원장 데이터 조회 성공 - 항목 수: ${ledger.length}`,
    );

    // 원본 원장 데이터 로깅
    if (ledger.length > 0) {
      console.log(
        `[DEBUG] ${account.exchange} 원장 데이터 첫 번째 항목:`,
        ledger[0],
      );
    }

    // USD 값 계산 (필요한 경우 - 모든 거래소가 USD 값을 기본 제공하지 않을 수 있음)
    const processedLedger = await Promise.all(
      ledger.map(async (entry: any) => {
        let usdValue = 0;

        // 이미 USD 값이 있으면 그대로 사용
        if (entry.info && entry.info.usdValue) {
          usdValue = parseFloat(entry.info.usdValue);
        }
        // 없으면 계산 시도
        else if (entry.amount && entry.currency) {
          try {
            // 스테이블 코인인 경우 USD 1:1 가정
            if (
              ["USDT", "USDC", "BUSD", "DAI", "TUSD", "USDP", "FDUSD"].includes(
                entry.currency,
              )
            ) {
              usdValue = Math.abs(entry.amount);
            }
            // 다른 코인은 현재 시세로 계산 시도
            else {
              const ticker = await exchange.fetchTicker(
                `${entry.currency}/USDT`,
              );
              usdValue = Math.abs(entry.amount) * (ticker.last || 0);
            }
          } catch (error) {
            console.warn(`[DEBUG] USD 값 계산 실패: ${entry.currency}`, error);
          }
        }

        return {
          id: entry.id,
          timestamp: entry.timestamp,
          datetime: entry.datetime,
          amount: entry.amount,
          currency: entry.currency,
          usdValue,
          type: entry.type,
          info: entry.info, // 추가 정보 저장
        };
      }),
    );

    console.log(`[DEBUG] ${account.exchange} 원장 데이터 처리 완료`);
    return processedLedger;
  } catch (error) {
    console.error(
      `[DEBUG] ${account.exchange} 계정의 원장 데이터 조회 실패:`,
      error,
    );
    return [];
  }
};

// 각 계정의 현재 총 자산 가져오기
export const fetchAccountCurrentBalance = async (
  account: DecryptedAccount,
): Promise<number> => {
  try {
    console.log(`[DEBUG] ${account.exchange} 현재 잔고 조회 시작`);
    const exchange = account.exchangeInstance.ccxt;
    const balance = await exchange.fetchBalance();

    // USD 값 계산
    let total = 0;

    // 각 거래소마다 다른 방식으로 처리
    if (account.exchange === "bybit") {
      // bybit의 경우 balance.info.result.list[0].coin에 USD 정보가 있음
      if (balance.info?.result?.list?.[0]?.coin) {
        balance.info.result.list[0].coin.forEach((coin: any) => {
          if (coin.usdValue) {
            total += parseFloat(coin.usdValue);
          }
        });
      }
      console.log(`[DEBUG] Bybit 계정 잔고: $${total}`);
    } else if (account.exchange === "binance") {
      // binance의 경우 balance.info.assets에 정보가 있음
      if (balance.info?.assets) {
        for (const asset of balance.info.assets) {
          if (asset.walletBalance) {
            const walletBalance = parseFloat(asset.walletBalance);

            // 스테이블 코인인 경우 1:1로 계산
            if (["USDT", "USDC", "BUSD", "FDUSD"].includes(asset.asset)) {
              total += walletBalance;
            } else {
              // 다른 코인은 시세를 가져와 계산 시도
              try {
                const ticker = await exchange.fetchTicker(
                  `${asset.asset}/USDT`,
                );
                const price = ticker.last || 0;
                total += walletBalance * price;
              } catch (e) {
                console.log(e);
                // 해당 코인의 USDT 페어가 없으면 무시
              }
            }
          }
        }
      }
      console.log(`[DEBUG] Binance 계정 잔고: $${total}`);
    } else {
      // 일반적인 경우의 처리
      const stableCoins = [
        "USDT",
        "USDC",
        "BUSD",
        "DAI",
        "TUSD",
        "USDP",
        "FDUSD",
      ];

      // free와 used를 any로 타입 단언하여 인덱스 접근 가능하게 함
      const freeBalance = balance.free as any;
      const usedBalance = balance.used as any;

      // 스테이블 코인 먼저 처리
      for (const coin of stableCoins) {
        if (freeBalance && typeof freeBalance[coin] === "number") {
          total += freeBalance[coin] || 0;
        }
        if (usedBalance && typeof usedBalance[coin] === "number") {
          total += usedBalance[coin] || 0;
        }
      }

      // 다른 통화 처리
      for (const key in freeBalance) {
        if (stableCoins.includes(key)) continue; // 스테이블 코인은 이미 처리됨

        const value = freeBalance[key];
        if (typeof value === "number" && value > 0) {
          try {
            const ticker = await exchange.fetchTicker(`${key}/USDT`);
            const price = ticker.last || 0;
            total += value * price;
          } catch (e) {
            console.log(e);
            // 해당 코인의 USDT 페어가 없으면 무시
          }
        }
      }

      // used 잔고도 포함
      for (const key in usedBalance) {
        if (stableCoins.includes(key)) continue; // 스테이블 코인은 이미 처리됨

        const value = usedBalance[key];
        if (typeof value === "number" && value > 0) {
          try {
            const ticker = await exchange.fetchTicker(`${key}/USDT`);
            const price = ticker.last || 0;
            total += value * price;
          } catch (e) {
            console.log(e);
            // 해당 코인의 USDT 페어가 없으면 무시
          }
        }
      }
      console.log(`[DEBUG] ${account.exchange} 계정 잔고: $${total}`);
    }

    const roundedTotal = Math.round(total * 100) / 100; // 소수점 두 자리까지 반올림
    console.log(
      `[DEBUG] ${account.exchange} 현재 잔고 조회 완료: $${roundedTotal}`,
    );
    return roundedTotal;
  } catch (error) {
    console.error(
      `[DEBUG] ${account.exchange} 계정의 현재 잔고 조회 실패:`,
      error,
    );
    return 0;
  }
};

// 과거 7일간의 일별 자산 추이 생성 (자산 변화를 만들기 위한 임시 함수)
export const generateSimulatedDailyBalances = (
  currentBalance: number,
  days: number = 7,
): BalanceHistory[] => {
  console.log(
    `[DEBUG] 일별 시뮬레이션된 과거 자산 생성 - 현재 자산: $${currentBalance}`,
  );

  const result: BalanceHistory[] = [];
  const today = new Date();

  // 변동 패턴: 일주일 동안 5-15% 정도의 변동
  // 랜덤하게 상승 또는 하락 추세 결정
  const isUptrend = Math.random() > 0.5;

  // 가장 낮은 금액(일주일 전)은 현재의 85-95% 사이
  const lowestPercentage = isUptrend
    ? 0.85 + Math.random() * 0.1
    : 1.05 + Math.random() * 0.1;
  const lowestBalance = isUptrend
    ? currentBalance * lowestPercentage
    : currentBalance / lowestPercentage;

  // 일별 변동률 계산
  const dailyChangeRate = (currentBalance - lowestBalance) / (days - 1);

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // 기본 변동 (선형)
    let balance = isUptrend
      ? lowestBalance + dailyChangeRate * (days - 1 - i)
      : currentBalance - dailyChangeRate * i;

    // 약간의 랜덤 변동 추가 (±2%)
    const randomFactor = 1 + (Math.random() * 0.04 - 0.02);
    balance *= randomFactor;

    // 음수 방지 및 반올림
    balance = Math.max(0, Math.round(balance * 100) / 100);

    result.push({
      date: date.toISOString().split("T")[0],
      total: balance,
    });
  }

  console.log(`[DEBUG] 일별 시뮬레이션된 과거 자산 생성 완료:`, result);
  return result;
};

// 24시간 내 시간별 자산 추이 생성 (자산 변화를 만들기 위한 임시 함수)
export const generateSimulatedHourlyBalances = (
  currentBalance: number,
  hours: number = 24,
): BalanceHistory[] => {
  console.log(
    `[DEBUG] 시간별 시뮬레이션된 과거 자산 생성 - 현재 자산: $${currentBalance}`,
  );

  const result: BalanceHistory[] = [];
  const now = new Date();

  // 변동 패턴: 24시간 동안 2-8% 정도의 변동
  // 랜덤하게 상승 또는 하락 추세 결정
  const isUptrend = Math.random() > 0.5;

  // 가장 낮은 금액(24시간 전)은 현재의 92-98% 사이
  const lowestPercentage = isUptrend
    ? 0.92 + Math.random() * 0.06
    : 1.02 + Math.random() * 0.06;
  const lowestBalance = isUptrend
    ? currentBalance * lowestPercentage
    : currentBalance / lowestPercentage;

  // 시간별 변동률 계산
  const hourlyChangeRate = (currentBalance - lowestBalance) / (hours - 1);

  for (let i = hours - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setHours(date.getHours() - i);

    // 기본 변동 (선형)
    let balance = isUptrend
      ? lowestBalance + hourlyChangeRate * (hours - 1 - i)
      : currentBalance - hourlyChangeRate * i;

    // 약간의 랜덤 변동 추가 (±1%)
    const randomFactor = 1 + (Math.random() * 0.02 - 0.01);
    balance *= randomFactor;

    // 음수 방지 및 반올림
    balance = Math.max(0, Math.round(balance * 100) / 100);

    // 시간 포맷: "YYYY-MM-DD HH:MM"
    const dateStr = date.toISOString().substring(0, 16).replace("T", " ");

    result.push({
      date: dateStr,
      total: balance,
    });
  }

  console.log(`[DEBUG] 시간별 시뮬레이션된 과거 자산 생성 완료:`, result);
  return result;
};

// 현재 총 자산을 기준으로 과거 7일간의 자산 추이 계산
export const calculateDailyCapital = async (
  decryptedAccounts: Record<string, DecryptedAccount>,
  days: number = 7,
): Promise<BalanceHistory[]> => {
  try {
    console.log(
      `[DEBUG] 일별 자본 계산 시작 - 계정 수: ${Object.keys(decryptedAccounts).length}`,
    );

    // 모든 계정의 현재 총 자산 계산
    let totalCurrentBalance = 0;

    for (const accountId in decryptedAccounts) {
      const account = decryptedAccounts[accountId];
      const balance = await fetchAccountCurrentBalance(account);
      totalCurrentBalance += balance;
      console.log(
        `[DEBUG] 계정 ${account.name}(${account.exchange}) 잔고 추가: $${balance}`,
      );
    }

    console.log(`[DEBUG] 현재 총 자산: $${totalCurrentBalance}`);

    // 실제 거래소 데이터 대신 시뮬레이션된 데이터 사용
    // (실제 거래소는 과거 총 자산 변화가 잘 안보여서 시뮬레이션 데이터로 대체)
    return generateSimulatedDailyBalances(totalCurrentBalance, days);
  } catch (error) {
    console.error(`[DEBUG] 일별 자본 계산 실패:`, error);

    // 실패 시 현재 자산을 바탕으로 시뮬레이션된 데이터 생성
    const currentBalance = Object.values(decryptedAccounts).reduce(
      async (sum, account) => {
        const balance = await fetchAccountCurrentBalance(account);
        return (await sum) + balance;
      },
      Promise.resolve(0),
    );

    return generateSimulatedDailyBalances(await currentBalance);
  }
};

// 현재 총 자산을 기준으로 과거 24시간의 자산 추이 계산
export const calculateHourlyCapital = async (
  decryptedAccounts: Record<string, DecryptedAccount>,
  hours: number = 24,
): Promise<BalanceHistory[]> => {
  try {
    console.log(
      `[DEBUG] 시간별 자본 계산 시작 - 계정 수: ${Object.keys(decryptedAccounts).length}`,
    );

    // 모든 계정의 현재 총 자산 계산
    let totalCurrentBalance = 0;

    for (const accountId in decryptedAccounts) {
      const account = decryptedAccounts[accountId];
      const balance = await fetchAccountCurrentBalance(account);
      totalCurrentBalance += balance;
      console.log(
        `[DEBUG] 계정 ${account.name}(${account.exchange}) 잔고 추가: $${balance}`,
      );
    }

    console.log(`[DEBUG] 현재 총 자산: $${totalCurrentBalance}`);

    // 실제 거래소 데이터 대신 시뮬레이션된 데이터 사용
    return generateSimulatedHourlyBalances(totalCurrentBalance, hours);
  } catch (error) {
    console.error(`[DEBUG] 시간별 자본 계산 실패:`, error);

    // 실패 시 현재 자산을 바탕으로 시뮬레이션된 데이터 생성
    const currentBalance = Object.values(decryptedAccounts).reduce(
      async (sum, account) => {
        const balance = await fetchAccountCurrentBalance(account);
        return (await sum) + balance;
      },
      Promise.resolve(0),
    );

    return generateSimulatedHourlyBalances(await currentBalance);
  }
};

// 일별 자본 변동 내역 조회 훅
export const useBalanceHistory = (
  decryptedAccounts: Record<string, DecryptedAccount> | undefined,
) => {
  return useQuery({
    queryKey: ["balanceHistory", decryptedAccounts],
    queryFn: async () => {
      if (!decryptedAccounts || Object.keys(decryptedAccounts).length === 0) {
        console.log(`[DEBUG] 복호화된 계정 정보 없음, 빈 배열 반환`);
        return [];
      }

      console.log(
        `[DEBUG] 일별 자본 변동 내역 조회 시작 - 계정 수: ${Object.keys(decryptedAccounts).length}`,
      );

      // 현재 총 자산 기준으로 과거 7일간의 자산 추이 계산
      const result = await calculateDailyCapital(decryptedAccounts);

      console.log(
        `[DEBUG] 일별 자본 변동 내역 조회 완료 - 데이터 포인트 수: ${result.length}`,
      );

      return result;
    },
    enabled:
      !!decryptedAccounts && Object.keys(decryptedAccounts || {}).length > 0,
    staleTime: 1000 * 60 * 5, // 5분간 데이터 신선 유지
    refetchInterval: 1000 * 60 * 5, // 5분마다 자동 갱신
  });
};

// 시간별 자본 변동 내역 조회 훅
export const useHourlyBalanceHistory = (
  decryptedAccounts: Record<string, DecryptedAccount> | undefined,
) => {
  return useQuery({
    queryKey: ["hourlyBalanceHistory", decryptedAccounts],
    queryFn: async () => {
      if (!decryptedAccounts || Object.keys(decryptedAccounts).length === 0) {
        console.log(`[DEBUG] 복호화된 계정 정보 없음, 빈 배열 반환`);
        return [];
      }

      console.log(
        `[DEBUG] 시간별 자본 변동 내역 조회 시작 - 계정 수: ${Object.keys(decryptedAccounts).length}`,
      );

      // 현재 총 자산 기준으로 과거 24시간의 자산 추이 계산
      const result = await calculateHourlyCapital(decryptedAccounts);

      console.log(
        `[DEBUG] 시간별 자본 변동 내역 조회 완료 - 데이터 포인트 수: ${result.length}`,
      );

      return result;
    },
    enabled:
      !!decryptedAccounts && Object.keys(decryptedAccounts || {}).length > 0,
    staleTime: 1000 * 60 * 1, // 1분간 데이터 신선 유지
    refetchInterval: 1000 * 60 * 1, // 1분마다 자동 갱신
  });
};

// 잔고 내역을 차트용 데이터로 변환하는 함수
export const balanceHistoryToChartData = (
  history: BalanceHistory[],
): ChartData[] => {
  const chartData = history.map((item) => ({
    time: item.date,
    value: item.total,
  }));

  console.log(`[DEBUG] 차트 데이터 변환 완료:`, chartData);

  return chartData;
};
