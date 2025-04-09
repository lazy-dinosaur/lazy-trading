import { useAccounts } from "@/contexts/accounts/use";
import { ScreenWrapper } from "@/components/screen-wrapper";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatUSDValue } from "@/lib/utils";
import { useNavigate } from "react-router";
import {
  CreditCard,
  Plus,
  RefreshCw,
  DollarSign,
  LineChart,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  TrendingUp,
  Info,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import CapitalChangeChart from "@/components/capital-change-chart";
// 보정 수익률 계산 함수 추가 import
import {
  useBalanceHistory,
  ChartData as BalanceChartData,
  calculateAdjustedReturn,
  AdjustedReturnMetrics,
} from "@/hooks/use-balance-history";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// 포지션 타입 정의
interface Position {
  id: string;
  symbol: string;
  side: "long" | "short";
  size: number;
  entryPrice: number;
  markPrice: number;
  pnl: number;
  pnlPercentage: number;
  accountId: string;
  accountName: string;
  exchange: string;
}

// CCXT 포지션 타입 정의
interface CCXTPosition {
  info: Record<string, any>;
  id?: string;
  symbol: string;
  timestamp?: number;
  datetime?: string;
  isolated?: boolean;
  hedged?: boolean;
  side: string;
  contracts?: number;
  contractSize?: number;
  entryPrice?: number;
  markPrice?: number;
  notional?: number;
  leverage?: number;
  collateral?: number;
  initialMargin?: number;
  maintenanceMargin?: number;
  initialMarginPercentage?: number;
  maintenanceMarginPercentage?: number;
  unrealizedPnl?: number;
  liquidationPrice?: number;
  marginMode?: string;
  marginRatio?: number;
  percentage?: number;
  [key: string]: any;
}

// ChartData 인터페이스는 hooks/use-balance-history에서 가져옴

const Dashboard = () => {
  const navigate = useNavigate();
  const {
    accounts,
    decryptedAccounts,
    accountsBalance,
    isLoading: isLoadingAccounts,
  } = useAccounts();

  // "all" 계정 ID를 사용하여 모든 계정의 합산 잔고 변동 내역 조회
  const {
    data: balanceHistory = [],
    isLoading: isLoadingBalanceHistory,
    error: balanceHistoryError,
  } = useBalanceHistory("all");

  const isErrorBalanceHistory = !!balanceHistoryError;

  // 차트 데이터 변환 (balance 필드 사용, 없으면 total 필드 사용)
  // 차트 데이터 변환
  const dailyChartData: BalanceChartData[] =
    balanceHistory?.map((item) => ({
      time: item.time || item.date || "",
      value: item.value || item.balance || 0,
    })) || [];

  // 총 잔액 계산
  const totalBalance = Object.values(accountsBalance || {}).reduce(
    (sum, item: any) => sum + (item.balance?.usd?.total || 0),
    0,
  );

  // 계정별 잔액 (상위 5개만)
  const accountsData = Object.values(accountsBalance || {})
    .sort(
      (a: any, b: any) =>
        (b.balance?.usd?.total || 0) - (a.balance?.usd?.total || 0),
    )
    .slice(0, 5);

  // 계정 갯수
  const accountCount = Object.keys(accounts || {}).length;

  // 포지션 데이터 처리 함수
  const processPositions = (
    positions: CCXTPosition[],
    account: any,
    accountId: string,
  ): Position[] => {
    const positionsData: Position[] = [];

    for (const pos of positions) {
      try {
        const side = pos.side.toLowerCase();
        if (side !== "long" && side !== "short") continue;

        const size = pos.contracts || 0;
        if (size <= 0) continue; // 오픈된 포지션만 표시

        const entryPrice = pos.entryPrice || 0;
        const markPrice = pos.markPrice || 0;
        const pnl = pos.unrealizedPnl || 0;

        // PnL 퍼센트 계산 (가능한 경우)
        let pnlPercentage = 0;
        if (entryPrice > 0) {
          if (side === "long") {
            pnlPercentage = ((markPrice - entryPrice) / entryPrice) * 100;
          } else {
            pnlPercentage = ((entryPrice - markPrice) / entryPrice) * 100;
          }
        }

        positionsData.push({
          id: `${account.exchange}-${pos.symbol}-${pos.side}-${accountId}`,
          symbol: pos.symbol,
          side: side as "long" | "short",
          size: size,
          entryPrice: entryPrice,
          markPrice: markPrice,
          pnl: pnl,
          pnlPercentage: pnlPercentage,
          accountId: accountId,
          accountName: account.name,
          exchange: account.exchange,
        });
      } catch (err) {
        console.error(`Error processing position data:`, err);
      }
    }
    return positionsData;
  };

  // React Query를 사용한 포지션 데이터 가져오기
  const { data: positions = [], isLoading: isLoadingPositions } = useQuery({
    queryKey: ["positions", decryptedAccounts],
    queryFn: async () => {
      if (!decryptedAccounts || Object.keys(decryptedAccounts).length === 0) {
        return [];
      }

      const accountData = decryptedAccounts;
      const allPositions: Position[] = [];

      // 각 계정별로 포지션 정보 가져오기
      for (const accountId in accountData) {
        const account = accountData[accountId];
        try {
          // CCXT를 통해 실제 포지션 데이터 가져오기
          const exchange = account.exchangeInstance.ccxt;
          const exchangeId = account.exchange;

          try {
            console.log(`${exchangeId}: 포지션 정보 가져오기 시도`);

            // watchPositions 사용
            const response =
              await account.exchangeInstance.pro.watchPositions();
            console.log(`${exchangeId}: 포지션 정보 가져오기 성공`);

            // 유효한 포지션 필터링 (계약 수량이 0보다 큰 포지션만)
            const validPositions = (response as CCXTPosition[]).filter(
              (pos) => pos.contracts !== undefined && pos.contracts > 0,
            );

            const accountPositions = processPositions(
              validPositions,
              account,
              accountId,
            );

            allPositions.push(...accountPositions);
          } catch (exchangeError) {
            console.error(
              `Error fetching positions from ${account.exchange}:`,
              exchangeError,
            );

            // 에러 발생 시 대체 메서드 시도 (거래소별로 API가 다를 수 있음)
            try {
              // fallback: fetchPositions 시도
              console.log(
                `${exchangeId}: watchPositions 실패, fetchPositions 시도`,
              );
              const response = await exchange.fetchPositions();

              const validPositions = (response as CCXTPosition[]).filter(
                (pos) => pos.contracts !== undefined && pos.contracts > 0,
              );

              const accountPositions = processPositions(
                validPositions,
                account,
                accountId,
              );

              allPositions.push(...accountPositions);
            } catch (fallbackError) {
              console.error(
                `Fallback fetchPositions also failed for ${account.exchange}:`,
                fallbackError,
              );
            }
          }
        } catch (error) {
          console.error(`Error processing account ${accountId}:`, error);
        }
      }

      // 포지션을 PnL 기준으로 내림차순 정렬
      return allPositions.sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl));
    },
    enabled: !!decryptedAccounts && Object.keys(decryptedAccounts).length > 0,
    refetchInterval: 500, // 1분마다 자동 새로고침
    staleTime: Infinity, // 30초 동안 데이터를 신선한 것으로 간주
  });

  // 보정 수익률 계산
  const { data: adjustedReturnData, isLoading: isLoadingAdjustedReturn } =
    useQuery<AdjustedReturnMetrics>({
      queryKey: ["adjustedReturn", balanceHistory, decryptedAccounts],
      queryFn: async () => {
        // 데이터 로딩 중이거나 에러 발생 시, 또는 데이터 포인트가 부족하면 계산 불가
        if (
          isLoadingBalanceHistory ||
          isErrorBalanceHistory ||
          !balanceHistory ||
          balanceHistory.length < 2 ||
          !decryptedAccounts ||
          Object.keys(decryptedAccounts).length === 0
        ) {
          return {
            initialAsset: 0,
            finalAsset: 0,
            deposits: 0,
            withdrawals: 0,
            averageCapital: 0,
            periodReturn: 0,
            adjustedReturnRate: 0,
            hasValidData: false,
          };
        }

        return calculateAdjustedReturn(decryptedAccounts, balanceHistory);
      },
      enabled:
        !isLoadingBalanceHistory &&
        !isErrorBalanceHistory &&
        !!balanceHistory &&
        balanceHistory.length >= 2 &&
        !!decryptedAccounts &&
        Object.keys(decryptedAccounts).length > 0,
    });

  // 일반 변동률 계산 (기존 코드 활용)
  const calculateRecentStableCoinChangeRate = () => {
    if (
      isLoadingBalanceHistory ||
      isErrorBalanceHistory ||
      !dailyChartData ||
      dailyChartData.length < 2
    ) {
      return null;
    }

    const oldestBalance = dailyChartData[0]?.value;
    const newestBalance = dailyChartData[dailyChartData.length - 1]?.value;

    if (!oldestBalance || oldestBalance === 0) return null;
    if (!newestBalance) return null;

    const changeRate = ((newestBalance - oldestBalance) / oldestBalance) * 100;
    return changeRate;
  };

  const recentStableCoinChangeRate = calculateRecentStableCoinChangeRate();

  return (
    <ScreenWrapper
      headerProps={{ title: "Dashboard" }}
      className="flex flex-col h-full"
    >
      <ScrollArea className="flex-1">
        {/* pb-20: 스크롤 영역 하단 여백, lg:grid: 큰 화면에서 그리드 레이아웃, lg:grid-cols-2: 2열, lg:gap-5: 열 간격 */}
        <div className="space-y-5 pb-20 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0">
          {/* 총 자산과 차트를 포함할 첫 번째 열 */}
          <div className="space-y-5 lg:col-span-1">
            {/* 총 자산 카드 */}
            <Card className="bg-primary/5">
              <CardHeader className="pb-2">
                <CardDescription>총 자산</CardDescription>
                {/* 작은 화면에서는 text-2xl, 큰 화면에서는 text-3xl */}
                <CardTitle className="text-2xl lg:text-3xl flex items-center">
                  {!accountsBalance ? (
                    <Skeleton className="h-10 w-32" />
                  ) : (
                    <>
                      <DollarSign className="h-6 w-6 mr-1" />
                      {formatUSDValue(totalBalance as number)}
                    </>
                  )}
                </CardTitle>
                {/* 보정 수익률 표시 */}
                {adjustedReturnData?.hasValidData ? (
                  <div
                    className={`flex items-center text-sm mt-1 ${adjustedReturnData.adjustedReturnRate >= 0 ? "text-green-500" : "text-red-500"}`}
                  >
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span className="flex items-center">
                      7일 보정 수익률:{" "}
                      {adjustedReturnData.adjustedReturnRate >= 0 ? "+" : ""}
                      {adjustedReturnData.adjustedReturnRate.toFixed(2)}%
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 ml-1 cursor-help opacity-70" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[280px]">
                            <p className="font-medium mb-1">
                              보정 수익률 = 기간수익금 / 투자자본금 평균
                            </p>
                            <ul className="text-xs space-y-1">
                              <li>
                                • 기간수익금: $
                                {formatUSDValue(
                                  adjustedReturnData.periodReturn,
                                )}
                              </li>
                              <li>
                                • 투자자본금: $
                                {formatUSDValue(
                                  adjustedReturnData.averageCapital,
                                )}
                              </li>
                              <li className="pt-1">
                                • 초기자산: $
                                {formatUSDValue(
                                  adjustedReturnData.initialAsset,
                                )}
                              </li>
                              <li>
                                • 현재자산: $
                                {formatUSDValue(adjustedReturnData.finalAsset)}
                              </li>
                              <li>
                                • 입금액: $
                                {formatUSDValue(adjustedReturnData.deposits)}
                              </li>
                              <li>
                                • 출금액: $
                                {formatUSDValue(adjustedReturnData.withdrawals)}
                              </li>
                              <li className="pt-1 text-muted-foreground">
                                투자자본금 = (입금액 - 출금액) + 초기자산
                              </li>
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground mt-1 flex items-center">
                    {isLoadingBalanceHistory || isLoadingAdjustedReturn ? (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        보정 수익률 계산 중...
                      </>
                    ) : (
                      <>
                        <span>보정 수익률 계산 불가</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 ml-1 cursor-help opacity-70" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                데이터가 부족하거나 계산 중 문제가 발생했습니다.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </>
                    )}
                  </div>
                )}

                {/* 기존 변동률도 함께 표시 (작게) */}
                {recentStableCoinChangeRate !== null && (
                  <div className="text-xs text-muted-foreground mt-1">
                    단순 변동률: {recentStableCoinChangeRate >= 0 ? "+" : ""}
                    {recentStableCoinChangeRate.toFixed(2)}%
                  </div>
                )}
              </CardHeader>
              <CardFooter className="pt-2 flex justify-end">
                {!accountsBalance && (
                  <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </CardFooter>
            </Card>

            {/* 스테이블 코인 잔고 변동 차트 */}
            <Card>
              <CardHeader>
                <CardTitle>주요 자산(USD) 변동</CardTitle>
                <CardDescription className="flex flex-col">
                  <span>지난 7일간 자산 및 보정 수익률 추이</span>
                  {adjustedReturnData?.hasValidData && (
                    <span className="text-xs mt-1">
                      투자자본금: $
                      {formatUSDValue(adjustedReturnData.averageCapital)}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CapitalChangeChart
                  data={dailyChartData}
                  isLoading={
                    isLoadingBalanceHistory ||
                    isLoadingAccounts ||
                    isLoadingAdjustedReturn
                  }
                  isError={isErrorBalanceHistory}
                  height={250}
                  adjustedReturn={adjustedReturnData}
                />
              </CardContent>
            </Card>
          </div>{" "}
          {/* 첫 번째 열 끝 */}
          {/* 계정 목록과 활성 포지션을 포함할 두 번째 열 */}
          <div className="space-y-5 lg:col-span-1">
            {/* 계정 요약 */}
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle>계정 목록 ({accountCount})</CardTitle>
                  <CardDescription>연결된 거래소 계정</CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate("/account/add?exchange=bybit")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  계정 추가
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {!accountsBalance ? (
                  Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 hover:bg-secondary/20 rounded"
                      >
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-5 w-5 rounded-full" />{" "}
                          {/* 지갑 아이콘 */}
                          <div>
                            <Skeleton className="h-5 w-24 mb-1" />{" "}
                            {/* 계정 이름 */}
                            <Skeleton className="h-3 w-16" />{" "}
                            {/* 거래소 이름 */}
                          </div>
                        </div>
                        <Skeleton className="h-5 w-20" /> {/* 금액 */}
                      </div>
                    ))
                ) : accountsData.length > 0 ? (
                  accountsData.map((item: any) => (
                    <div
                      key={item.account.id}
                      className="flex items-center justify-between p-2 hover:bg-secondary/20 rounded cursor-pointer"
                      onClick={() =>
                        navigate(`/account/detail/${item.account.id}`)
                      }
                    >
                      <div className="flex items-center gap-3">
                        <Wallet className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{item.account.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.account.exchange}
                          </p>
                        </div>
                      </div>
                      <p className="font-medium">
                        ${formatUSDValue(item.balance?.usd?.total || 0)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <CreditCard className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>등록된 계정이 없습니다</p>
                    <Button
                      className="mt-4"
                      variant="outline"
                      onClick={() => navigate("/account/add")}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      계정 추가하기
                    </Button>
                  </div>
                )}
              </CardContent>
              {accountsData.length > 0 && (
                <CardFooter>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => navigate("/accounts")}
                  >
                    모든 계정 보기
                  </Button>
                </CardFooter>
              )}
            </Card>

            {/* 활성 포지션 목록 */}
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle>활성 포지션</CardTitle>
                  <CardDescription>현재 진입 중인 거래 포지션</CardDescription>
                </div>
                {isLoadingPositions && (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                )}
              </CardHeader>
              <CardContent>
                {/* 작은 화면에서는 높이 200px, 큰 화면(lg)에서는 300px */}
                <ScrollArea className="h-[200px] lg:h-[300px] pr-4">
                  <div className="space-y-2">
                    {isLoadingPositions ? (
                      Array(3)
                        .fill(0)
                        .map((_, i) => (
                          <div
                            key={i}
                            className="flex flex-col p-3 border rounded-lg mb-2"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <Skeleton className="h-5 w-5 rounded-full" />{" "}
                                {/* 포지션 방향 아이콘 */}
                                <Skeleton className="h-5 w-16" /> {/* 심볼 */}
                                <Skeleton className="h-5 w-12 rounded-full" />{" "}
                                {/* 배지 */}
                              </div>
                              <Skeleton className="h-5 w-24" /> {/* PnL */}
                            </div>
                            <div className="flex justify-between text-sm mt-2">
                              <div>
                                <Skeleton className="h-4 w-20 mb-1" />{" "}
                                {/* 계약 수 */}
                                <Skeleton className="h-4 w-28" />{" "}
                                {/* 진입 가격 */}
                              </div>
                              <div className="text-right">
                                <Skeleton className="h-4 w-28 mb-1" />{" "}
                                {/* 표시 가격 */}
                                <Skeleton className="h-4 w-32" />{" "}
                                {/* 계정 정보 */}
                              </div>
                            </div>
                          </div>
                        ))
                    ) : positions.length > 0 ? (
                      positions.map((position) => (
                        <div
                          key={position.id}
                          className="flex flex-col p-3 border rounded-lg hover:bg-secondary/10 cursor-pointer"
                          onClick={() =>
                            navigate(
                              `/trade?symbol=${position.symbol}&id=${position.accountId}&exchange=${position.exchange}`,
                              {
                                state: { fromPosition: true },
                              },
                            )
                          }
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              {position.side === "long" ? (
                                <ArrowUpCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <ArrowDownCircle className="h-5 w-5 text-red-500" />
                              )}
                              <span className="font-medium">
                                {position.symbol}
                              </span>
                              <Badge
                                variant={
                                  position.side === "long"
                                    ? "outline"
                                    : "secondary"
                                }
                              >
                                {position.side === "long" ? "LONG" : "SHORT"}
                              </Badge>
                            </div>
                            <div
                              className={`font-medium ${position.pnl >= 0 ? "text-green-500" : "text-red-500"}`}
                            >
                              {position.pnl >= 0 ? "+" : ""}
                              {formatUSDValue(position.pnl)} (
                              {position.pnlPercentage.toFixed(2)}%)
                            </div>
                          </div>
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <div>
                              <div>
                                {position.size.toFixed(
                                  position.size < 1 ? 4 : 2,
                                )}{" "}
                                계약
                              </div>
                              <div>
                                진입: ${formatUSDValue(position.entryPrice)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div>
                                표시: ${formatUSDValue(position.markPrice)}
                              </div>
                              <div>
                                {position.accountName} ({position.exchange})
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-muted-foreground">
                        <LineChart className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p>활성화된 포지션이 없습니다</p>
                        <Button
                          className="mt-4"
                          variant="outline"
                          onClick={() => navigate("/search")}
                        >
                          <LineChart className="h-4 w-4 mr-2" />
                          거래 검색하기
                        </Button>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>{" "}
          {/* 두 번째 열 끝 */}
        </div>
      </ScrollArea>
    </ScreenWrapper>
  );
};

export default Dashboard;
