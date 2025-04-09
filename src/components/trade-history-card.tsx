import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { TradeHistoryItem, TradeHistoryStats } from "@/hooks/use-trade-history";
import { formatUSDValue } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface TradeHistoryCardProps {
  trades: TradeHistoryItem[];
  stats: TradeHistoryStats | null; // 여전히 props로 받지만 내부에서는 필터링된 통계를 사용
  isLoading: boolean;
}

export const TradeHistoryCard = ({
  trades,
  stats,
  isLoading,
}: TradeHistoryCardProps) => {
  // 최신순(최근 거래가 먼저 오도록)으로 정렬된 거래 내역
  const sortedTrades = useMemo(() => {
    if (!trades || trades.length === 0) return [];
    return [...trades].sort((a, b) => b.timestamp - a.timestamp);
  }, [trades]);

  // 차트 데이터 준비를 위한 유효한 통계 확인
  const activeStats = stats;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>거래 내역</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!trades || trades.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>거래 내역</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-6">
            거래 내역이 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (sortedTrades.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>거래 내역</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-6">
            선택한 기간에 거래 내역이 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  // 승률 차트 데이터
  const pieChartData = activeStats
    ? [
        { name: "승리 거래", value: activeStats.winningTrades },
        { name: "패배 거래", value: activeStats.losingTrades },
      ]
    : [];

  // 최근 10개 거래 수익 차트 데이터 - 이익/손실이 있는 거래만 포함
  const recentTradesData = sortedTrades
    .filter((trade) => trade.profit !== undefined && trade.profit !== 0)
    .slice(0, 10)
    .map((trade, index) => ({
      name: `${trade.symbol.split("/")[0]}`, // 심볼 이름을 표시
      index: `#${index + 1}`,
      profit: trade.profit,
      symbol: trade.symbol.split("/")[0],
    }));

  // 차트 표시 여부 - 수익 정보가 있는 거래가 없으면 차트를 표시하지 않음
  const hasTradesWithProfit = sortedTrades.some(
    (trade) => trade.profit !== undefined && trade.profit !== 0,
  );

  const COLORS = ["#10b981", "#ef4444"];

  return (
    <Card>
      <CardHeader>
        <CardTitle>거래 내역</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="stats">
          <TabsList className="mb-4">
            <TabsTrigger value="stats">통계</TabsTrigger>
            <TabsTrigger value="history">거래 목록</TabsTrigger>
            <TabsTrigger value="charts">차트 분석</TabsTrigger>
          </TabsList>

          <TabsContent value="stats">
            {activeStats && activeStats.totalTrades > 0 ? (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">총 거래 횟수</p>
                  <p className="text-2xl font-medium">
                    {activeStats.totalTrades}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">승률</p>
                  <p className="text-2xl font-medium">
                    {activeStats.winRate.toFixed(1)}%
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">총 수익</p>
                  <p
                    className={`text-2xl font-medium ${activeStats.totalProfit >= 0 ? "text-green-500" : "text-red-500"}`}
                  >
                    {formatUSDValue(activeStats.totalProfit)} USD
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">평균 수익</p>
                  <p
                    className={`text-2xl font-medium ${activeStats.averageProfit >= 0 ? "text-green-500" : "text-red-500"}`}
                  >
                    {formatUSDValue(activeStats.averageProfit)} USD
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">최대 수익</p>
                  <p className="text-2xl font-medium text-green-500">
                    {formatUSDValue(activeStats.largestWin)} USD
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">최대 손실</p>
                  <p className="text-2xl font-medium text-red-500">
                    {formatUSDValue(activeStats.largestLoss)} USD
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center">
                <p className="text-muted-foreground">
                  해당 기간에 수익 정보가 있는 거래 내역이 없습니다.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  거래 내역이 있지만 수익 정보를 계산할 수 없는 경우,
                  <br />
                  다른 기간을 선택하거나 새로운 거래를 시도해 보세요.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent
            value="history"
            className="h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-background"
          >
            <Table className="overflow-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-background">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">날짜</TableHead>
                  <TableHead className="w-[120px]">심볼</TableHead>
                  <TableHead className="w-[100px]">유형</TableHead>
                  <TableHead className="w-[100px]">가격</TableHead>
                  <TableHead className="w-[100px]">수량</TableHead>
                  <TableHead className="w-[100px]">총액</TableHead>
                  <TableHead className="w-[120px]">이익</TableHead>
                  <TableHead className="w-[110px]">주문 ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTrades.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell>
                      {new Date(trade.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>{trade.symbol}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge
                          variant={
                            trade.side === "buy" ? "default" : "destructive"
                          }
                        >
                          {trade.side === "buy" ? "매수" : "매도"}
                        </Badge>
                        {trade.isClosingPosition && (
                          <Badge
                            variant="secondary"
                            className="whitespace-nowrap text-xs"
                          >
                            포지션 종료
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatUSDValue(trade.price)}</TableCell>
                    <TableCell>{formatUSDValue(trade.amount)}</TableCell>
                    <TableCell>{formatUSDValue(trade.cost)}</TableCell>
                    <TableCell
                      className={
                        trade.profit && trade.profit > 0
                          ? "text-green-500"
                          : "text-red-500"
                      }
                    >
                      {trade.profit ? formatUSDValue(trade.profit) : "-"}
                      {trade.profitPercent
                        ? ` (${trade.profitPercent > 0 ? "+" : ""}${trade.profitPercent.toFixed(2)}%)`
                        : ""}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {trade.orderId
                        ? `${trade.orderId.substring(0, 8)}...`
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="charts">
            {hasTradesWithProfit ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">승패 비율</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {pieChartData.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [`${value}건`, "거래 수"]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">최근 거래 수익</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={recentTradesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [
                            `${formatUSDValue(value as number)} USD`,
                            "수익",
                          ]}
                        />
                        <Legend />
                        {/* 양수와 음수 값에 대해 분리된 바를 사용 */}
                        <Bar
                          name="수익"
                          dataKey={(data) =>
                            data.profit >= 0 ? data.profit : 0
                          }
                          fill="#10b981"
                        />
                        <Bar
                          name="손실"
                          dataKey={(data) =>
                            data.profit < 0 ? data.profit * -1 : 0
                          }
                          fill="#ef4444"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center">
                <p className="text-muted-foreground">
                  해당 기간에 수익 정보가 있는 거래 내역이 없어 차트를 표시할 수
                  없습니다.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  거래 내역이 있지만 수익 정보를 계산할 수 없는 경우,
                  <br />
                  다른 기간을 선택하거나 새로운 거래를 시도해 보세요.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
