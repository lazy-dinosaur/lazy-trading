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
} from "lucide-react";
// React 임포트 제거
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";

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

const Dashboard = () => {
  const navigate = useNavigate();
  const { accounts, decryptedAccounts, accountsBalance } = useAccounts();

  // React Query를 사용한 계정 잔액 정보 가져오기

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

  // 계정 데이터 새로고침 함수는 더 이상 필요하지 않음

  return (
    <ScreenWrapper headerProps={{ title: "Dashboard" }} className="space-y-5">
      {/* 총 자산 카드 */}
      <Card className="bg-primary/5">
        <CardHeader className="pb-2">
          <CardDescription>총 자산</CardDescription>
          <CardTitle className="text-3xl flex items-center">
            {!accountsBalance ? (
              <Skeleton className="h-10 w-32" />
            ) : (
              <>
                <DollarSign className="h-6 w-6 mr-1" />
                {formatUSDValue(totalBalance as number)}
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardFooter className="pt-2 flex justify-end">
          {!accountsBalance && (
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </CardFooter>
      </Card>

      {/* 계정 요약 */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle>계정 목록 ({accountCount})</CardTitle>
            <CardDescription>연결된 거래소 계정</CardDescription>
          </div>
          <Button variant="outline" onClick={() => navigate("/account/add")}>
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
                      <Skeleton className="h-5 w-24 mb-1" /> {/* 계정 이름 */}
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
                onClick={() => navigate(`/accounts?id=${item.account.id}`)}
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
          {isLoadingPositions && <RefreshCw className="h-4 w-4 animate-spin" />}
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
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
                          <Skeleton className="h-4 w-20 mb-1" /> {/* 계약 수 */}
                          <Skeleton className="h-4 w-28" /> {/* 진입 가격 */}
                        </div>
                        <div className="text-right">
                          <Skeleton className="h-4 w-28 mb-1" />{" "}
                          {/* 표시 가격 */}
                          <Skeleton className="h-4 w-32" /> {/* 계정 정보 */}
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
                        `/trade?symbol=${position.symbol}&id=${position.accountId}`,
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
                        <span className="font-medium">{position.symbol}</span>
                        <Badge
                          variant={
                            position.side === "long" ? "outline" : "secondary"
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
                          {position.size.toFixed(position.size < 1 ? 4 : 2)}{" "}
                          계약
                        </div>
                        <div>진입: ${formatUSDValue(position.entryPrice)}</div>
                      </div>
                      <div className="text-right">
                        <div>표시: ${formatUSDValue(position.markPrice)}</div>
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
    </ScreenWrapper>
  );
};

export default Dashboard;
