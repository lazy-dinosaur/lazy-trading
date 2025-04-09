import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { TradeHistoryItem, TradeHistoryStats } from "@/hooks/use-trade-history";
import { formatUSDValue } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
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
} from "recharts";

interface TradeHistoryCardProps {
  trades: TradeHistoryItem[];
  stats: TradeHistoryStats | null; // 여전히 props로 받지만 내부에서는 필터링된 통계를 사용
  isLoading: boolean;
}

export const TradeHistoryCard = ({ trades, isLoading }: TradeHistoryCardProps) => {
  // 기간 필터 상태 - 최근 7일을 기본값으로 설정
  const [periodFilter, setPeriodFilter] = useState<string>("7d");
  
  // 현재 선택된 기간에 따라 거래 내역 필터링
  const filteredTrades = useMemo(() => {
    if (!trades || trades.length === 0) return [];
    
    const now = new Date().getTime();
    
    switch (periodFilter) {
      case "7d":
        return trades.filter(trade => 
          trade.timestamp > now - 7 * 24 * 60 * 60 * 1000
        );
      case "30d":
        return trades.filter(trade => 
          trade.timestamp > now - 30 * 24 * 60 * 60 * 1000
        );
      case "90d":
        return trades.filter(trade => 
          trade.timestamp > now - 90 * 24 * 60 * 60 * 1000
        );
      case "all":
      default:
        return trades;
    }
  }, [trades, periodFilter]);
  
  // 최신순(최근 거래가 먼저 오도록)으로 정렬된 거래 내역
  const sortedTrades = useMemo(() => {
    return [...filteredTrades].sort((a, b) => b.timestamp - a.timestamp);
  }, [filteredTrades]);
  
  // 정렬된 거래 내역으로 통계 다시 계산
  const filteredStats = useMemo(() => {
    if (!filteredTrades || filteredTrades.length === 0) return null;
    
    const tradesWithProfit = filteredTrades.filter(t => t.profit !== undefined);
    const winningTrades = tradesWithProfit.filter(t => (t.profit || 0) > 0);
    const losingTrades = tradesWithProfit.filter(t => (t.profit || 0) < 0);
    
    const totalProfit = tradesWithProfit.reduce((sum, t) => sum + (t.profit || 0), 0);
    const largestWin = winningTrades.length ? Math.max(...winningTrades.map(t => t.profit || 0)) : 0;
    const largestLoss = losingTrades.length ? Math.min(...losingTrades.map(t => t.profit || 0)) : 0;
    
    return {
      totalTrades: tradesWithProfit.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: tradesWithProfit.length ? (winningTrades.length / tradesWithProfit.length) * 100 : 0,
      totalProfit,
      averageProfit: tradesWithProfit.length ? totalProfit / tradesWithProfit.length : 0,
      largestWin,
      largestLoss
    };
  }, [filteredTrades]);
  
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
  
  if (filteredTrades.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>거래 내역</CardTitle>
          <div className="flex items-center space-x-2">
            <Select
              value={periodFilter}
              onValueChange={setPeriodFilter}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="기간 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">최근 7일</SelectItem>
                <SelectItem value="30d">최근 30일</SelectItem>
                <SelectItem value="90d">최근 90일</SelectItem>
                <SelectItem value="all">전체 기간</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
  const pieChartData = filteredStats ? [
    { name: '승리', value: filteredStats.winningTrades },
    { name: '패배', value: filteredStats.losingTrades }
  ] : [];

  // 최근 10개 거래 수익 차트 데이터
  const recentTradesData = sortedTrades
    .filter(trade => trade.profit !== undefined)
    .slice(0, 10)
    .map((trade, index) => ({
      name: `#${index + 1}`,
      profit: trade.profit,
    }));

  const COLORS = ['#10b981', '#ef4444'];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>거래 내역</CardTitle>
        <div className="flex items-center space-x-2">
          <Select
            value={periodFilter}
            onValueChange={setPeriodFilter}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="기간 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">최근 7일</SelectItem>
              <SelectItem value="30d">최근 30일</SelectItem>
              <SelectItem value="90d">최근 90일</SelectItem>
              <SelectItem value="all">전체 기간</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="stats">
          <TabsList className="mb-4">
            <TabsTrigger value="stats">통계</TabsTrigger>
            <TabsTrigger value="history">거래 목록</TabsTrigger>
            <TabsTrigger value="charts">차트 분석</TabsTrigger>
          </TabsList>
          
          <TabsContent value="stats">
            {filteredStats && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">총 거래 횟수</p>
                  <p className="text-2xl font-medium">{filteredStats.totalTrades}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">승률</p>
                  <p className="text-2xl font-medium">{filteredStats.winRate.toFixed(1)}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">총 수익</p>
                  <p className={`text-2xl font-medium ${filteredStats.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatUSDValue(filteredStats.totalProfit)} USD
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">평균 수익</p>
                  <p className={`text-2xl font-medium ${filteredStats.averageProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatUSDValue(filteredStats.averageProfit)} USD
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">최대 수익</p>
                  <p className="text-2xl font-medium text-green-500">
                    {formatUSDValue(filteredStats.largestWin)} USD
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">최대 손실</p>
                  <p className="text-2xl font-medium text-red-500">
                    {formatUSDValue(filteredStats.largestLoss)} USD
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="history">
            <ScrollArea className="h-80">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>날짜</TableHead>
                    <TableHead>심볼</TableHead>
                    <TableHead>유형</TableHead>
                    <TableHead>가격</TableHead>
                    <TableHead>수량</TableHead>
                    <TableHead>총액</TableHead>
                    <TableHead>이익</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTrades.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell>{new Date(trade.timestamp).toLocaleString()}</TableCell>
                      <TableCell>{trade.symbol}</TableCell>
                      <TableCell>
                        <Badge variant={trade.side === 'buy' ? 'default' : 'destructive'}>
                          {trade.side === 'buy' ? '매수' : '매도'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatUSDValue(trade.price)}</TableCell>
                      <TableCell>{formatUSDValue(trade.amount)}</TableCell>
                      <TableCell>{formatUSDValue(trade.cost)}</TableCell>
                      <TableCell className={trade.profit && trade.profit > 0 ? 'text-green-500' : 'text-red-500'}>
                        {trade.profit ? formatUSDValue(trade.profit) : '-'}
                        {trade.profitPercent ? ` (${trade.profitPercent > 0 ? '+' : ''}${trade.profitPercent.toFixed(2)}%)` : ''}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="charts">
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
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}건`, '거래 수']} />
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
                      <Tooltip formatter={(value) => [`${formatUSDValue(value as number)} USD`, '수익']} />
                      <Bar
                        dataKey="profit"
                        fill="#10b981"
                        // Bar의 색상을 동적으로 변경하려면 다른 방법을 사용해야 합니다
                        // 아래 Bar 컴포넌트로 양수/음수 별로 나눠서 렌더링
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
