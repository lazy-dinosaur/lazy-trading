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
import { useTranslation } from "react-i18next";
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
  X,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useQueryClient } from "@tanstack/react-query";
// import CapitalChangeChart from "@/components/capital-change-chart";
import { PositionCloseModal } from "@/components/position-close-modal";
import { useState } from "react";
import toast from "react-hot-toast";
// 보정 수익률 및 변동률 관련 코드 제거

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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    accounts,
    decryptedAccounts,
    accountsBalance,
    // isLoading: isLoadingAccounts,
  } = useAccounts();

  // 포지션 종료 관련 상태
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isClosingPosition, setIsClosingPosition] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [isCloseSuccess, setIsCloseSuccess] = useState(false);

  // 변동 내역 추적 코드 제거됨

  // 포지션 종료 관련 함수
  const handleClosePosition = async (position: Position) => {
    setIsClosingPosition(true);
    setCloseError(null);

    try {
      // 계정 정보 가져오기
      if (!decryptedAccounts) {
        throw new Error("계정 정보를 찾을 수 없습니다.");
      }

      const account = decryptedAccounts[position.accountId];
      if (!account) {
        throw new Error("계정 정보를 찾을 수 없습니다.");
      }

      const exchange = account.exchangeInstance.ccxt;
      const closeSide = position.side === "long" ? "sell" : "buy";
      let positionSize = position.size;

      // 포지션 종료를 위한 파라미터 설정
      let params: any = { reduceOnly: true };

      // 비트겟 거래소인 경우 포지션 모드에 따라 oneWayMode와 hedged 설정
      if (account.exchange === 'bitget') {
        // 계정의 포지션 모드 확인 (기본값: "oneway")
        const positionMode = account.positionMode || "oneway";

        positionSize = positionSize / 100;

        params = {
          reduceOnly: true,
          hedged: positionMode === "hedge", // 헷지 모드면 true, 아니면 false
          oneWayMode: positionMode !== "hedge" // 헷지 모드면 false, 아니면 true
        };
        console.log(`비트겟 포지션 종료 - 모드: ${positionMode}, 파라미터:`, params);
      } else if (account.exchange === "binance") {
        // Binance hedge mode: use positionSide
        params = {
          // reduceOnly: true,
          // positionSide: position.side === "long" ? "LONG" : "SHORT"
        };
      } else if (account.exchange === "bybit") {
        // Bybit: 계정의 포지션 모드에 따라 다른 파라미터 사용
        const isHedgeMode = account.positionMode === "hedge";

        if (isHedgeMode) {
          // 헷지 모드에서는 positionIdx 사용
          // long: 1, short: 2
          params = {
            reduceOnly: true,
            positionIdx: position.side === "long" ? 1 : 2,
          };
        } else {
          // 원웨이 모드에서는 positionIdx: 0 사용
          params = {
            reduceOnly: true,
            positionIdx: 0,
          };
        }
      }

      // 포지션 종료 주문 생성
      const order = await exchange.createOrder(
        position.symbol,
        "market",
        closeSide,
        positionSize,
        undefined,
        params
      );

      console.log("포지션 종료 주문 생성:", position.symbol, position.side);

      // 성공 처리
      setIsCloseSuccess(true);
      toast.success(t('trade.close_position_success', { symbol: position.symbol, orderId: order.id }));

      // 포지션 데이터와 계정 잔액 새로고침
      queryClient.invalidateQueries({ queryKey: ["positions", account.exchange, position.accountId] });
      queryClient.invalidateQueries({ queryKey: ["accountsBalance"] });
    } catch (error) {
      console.error("포지션 종료 중 오류 발생:", error);
      setCloseError(error instanceof Error ? error.message : t('common.error'));
      toast.error(t('trade.close_position_error'));
    } finally {
      setIsClosingPosition(false);
    }
  };

  // 모달 제어 함수
  const openCloseModal = (position: Position) => {
    setSelectedPosition(position);
    setIsCloseModalOpen(true);
    setIsCloseSuccess(false);
    setCloseError(null);
  };

  const closeModal = () => {
    setIsCloseModalOpen(false);

    // 성공 후 모달이 닫히면 선택된 포지션 정보 초기화
    if (isCloseSuccess) {
      setTimeout(() => {
        setSelectedPosition(null);
        setIsCloseSuccess(false);
      }, 300);
    }
  };

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

  // 보정 수익률 계산 코드 제거됨

  // 변동률 계산 코드 제거됨

  return (
    <ScreenWrapper
      headerProps={{ title: "Dashboard" }}
      className="flex flex-col h-full overflow-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-background"
    >
      {/* pb-20: 스크롤 영역 하단 여백, lg:grid: 큰 화면에서 그리드 레이아웃, lg:grid-cols-2: 2열, lg:gap-5: 열 간격 */}
      <div className="space-y-5 pb-20 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0">
        {/* 총 자산과 차트를 포함할 첫 번째 열 */}
        <div className="space-y-5 lg:col-span-1">
          {/* 총 자산 카드 */}
          <Card className="bg-primary/5">
            <CardHeader className="pb-2">
              <CardDescription>{t('dashboard.total_balance')}</CardDescription>
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
              
              {/* 총액과 사용 중인 금액 정보 표시 */}
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{t('account.in_order')}</p>
                  <p className="text-lg font-medium">
                    {!accountsBalance ? (
                      <Skeleton className="h-6 w-24" />
                    ) : (
                      `${formatUSDValue(
                        Object.values(accountsBalance || {}).reduce(
                          (sum, item: any) => sum + (item.balance?.usd?.used || 0),
                          0,
                        )
                      )} USD`
                    )}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{t('common.accounts')}</p>
                  <p className="text-lg font-medium">
                    {!accounts ? (
                      <Skeleton className="h-6 w-16" />
                    ) : (
                      Object.keys(accounts || {}).length
                    )}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardFooter className="pt-2 flex justify-end">
              {!accountsBalance && (
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </CardFooter>
          </Card>

          {/* 차트 부분 제거됨 */}
        </div>
        {/* 첫 번째 열 끝 */}
        {/* 계정 목록과 활성 포지션을 포함할 두 번째 열 */}
        <div className="space-y-5 lg:col-span-1">
          {/* 계정 요약 */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('dashboard.account_count', { count: accountCount })}</CardTitle>
                <CardDescription>{t('dashboard.connected_exchange_accounts')}</CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate("/account/add?exchange=bybit")}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('dashboard.add_account')}
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
                          <Skeleton className="h-3 w-16" /> {/* 거래소 이름 */}
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
                  <p>{t('dashboard.no_accounts')}</p>
                  <Button
                    className="mt-4"
                    variant="outline"
                    onClick={() => navigate("/account/add")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('dashboard.add_account_button')}
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
                  {t('dashboard.view_all_accounts')}
                </Button>
              </CardFooter>
            )}
          </Card>

          {/* 활성 포지션 목록 */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('dashboard.active_positions')}</CardTitle>
                <CardDescription>{t('dashboard.active_positions_desc')}</CardDescription>
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
                        className="flex flex-col p-3 border rounded-lg hover:bg-secondary/10"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() =>
                              navigate(
                                `/trade?symbol=${position.symbol}&id=${position.accountId}&exchange=${position.exchange}`,
                                {
                                  state: { fromPosition: true },
                                },
                              )
                            }
                          >
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
                          <div className="flex items-center gap-2">
                            <div
                              className={`font-medium ${position.pnl >= 0 ? "text-green-500" : "text-red-500"}`}
                            >
                              {position.pnl >= 0 ? "+" : ""}
                              {formatUSDValue(position.pnl)} (
                              {position.pnlPercentage.toFixed(2)}%)
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive/80 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                openCloseModal(position);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div
                          className="flex justify-between text-sm text-muted-foreground cursor-pointer"
                          onClick={() =>
                            navigate(
                              `/trade?symbol=${position.symbol}&id=${position.accountId}&exchange=${position.exchange}`,
                              {
                                state: { fromPosition: true },
                              },
                            )
                          }
                        >
                          <div>
                            <div>
                              {position.size.toFixed(position.size < 1 ? 4 : 2)}{" "}
                              {t('dashboard.contract')}
                            </div>
                            <div>
                              {t('dashboard.entry')} {formatUSDValue(position.entryPrice)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div>
                              {t('dashboard.mark')} {formatUSDValue(position.markPrice)}
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
                      <p>{t('dashboard.no_active_positions')}</p>
                      <Button
                        className="mt-4"
                        variant="outline"
                        onClick={() => navigate("/search")}
                      >
                        <LineChart className="h-4 w-4 mr-2" />
                        {t('dashboard.search_trades')}
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        {/* 두 번째 열 끝 */}
      </div>

      {/* 포지션 종료 모달 */}
      <PositionCloseModal
        isOpen={isCloseModalOpen}
        onClose={closeModal}
        position={selectedPosition}
        onConfirm={handleClosePosition}
        isClosing={isClosingPosition}
        closeError={closeError}
        isSuccess={isCloseSuccess}
      />
    </ScreenWrapper>
  );
};

export default Dashboard;
