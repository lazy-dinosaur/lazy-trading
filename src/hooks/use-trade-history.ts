import { useAccounts } from "@/contexts/accounts/use";
import { useQuery } from "@tanstack/react-query";

export interface TradeHistoryItem {
  id: string;
  timestamp: number;
  datetime: string;
  symbol: string;
  side: 'buy' | 'sell';
  price: number;
  amount: number;
  cost: number;
  fee?: {
    cost: number;
    currency: string;
  };
  type: string;
  profit?: number;
  profitPercent?: number;
}

export interface TradeHistoryStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfit: number;
  averageProfit: number;
  largestWin: number;
  largestLoss: number;
}

export interface TradeHistoryFilter {
  period?: '7d' | '30d' | '90d' | 'all';
  limit?: number;
}

export const useTradeHistory = (accountId?: string, filter?: TradeHistoryFilter) => {
  const limit = filter?.limit || 100;
  const period = filter?.period || '7d';
  const { decryptedAccounts } = useAccounts();
  
  return useQuery({
    queryKey: ["tradeHistory", accountId, limit, period],
    queryFn: async (): Promise<{
      trades: TradeHistoryItem[],
      stats: TradeHistoryStats | null
    }> => {
      if (!accountId || !decryptedAccounts || !decryptedAccounts[accountId]) {
        return { trades: [], stats: null };
      }

      const account = decryptedAccounts[accountId];
      // 필요하면 나중에 사용: const exchange = account.exchange;
      
      try {
        // 계정의 거래 내역 가져오기
        const myTrades = await account.exchangeInstance.ccxt.fetchMyTrades(undefined, undefined, limit);
        
        // 거래 내역 형식 변환
        const formattedTrades: TradeHistoryItem[] = myTrades.map(trade => ({
          id: trade.id || String(trade.timestamp), // id가 없으면 timestamp를 사용
          timestamp: trade.timestamp || 0,
          datetime: trade.datetime || new Date().toISOString(),
          symbol: trade.symbol || "",
          side: (trade.side as 'buy' | 'sell') || 'buy',
          price: trade.price || 0,
          amount: trade.amount || 0,
          cost: trade.cost || 0,
          fee: trade.fee ? {
            cost: typeof trade.fee.cost === 'number' ? trade.fee.cost : 0,
            currency: trade.fee.currency || 'USD'
          } : undefined,
          type: trade.type || 'unknown',
          profit: trade.info?.realizedPnl ? parseFloat(trade.info.realizedPnl) : undefined,
          profitPercent: trade.info?.roi ? parseFloat(trade.info.roi) * 100 : undefined
        }));
        
        // 거래 통계 계산
        let stats: TradeHistoryStats | null = null;
        
        if (formattedTrades.length > 0) {
          const tradesWithProfit = formattedTrades.filter(t => t.profit !== undefined);
          const winningTrades = tradesWithProfit.filter(t => (t.profit || 0) > 0);
          const losingTrades = tradesWithProfit.filter(t => (t.profit || 0) < 0);
          
          const totalProfit = tradesWithProfit.reduce((sum, t) => sum + (t.profit || 0), 0);
          const largestWin = winningTrades.length ? Math.max(...winningTrades.map(t => t.profit || 0)) : 0;
          const largestLoss = losingTrades.length ? Math.min(...losingTrades.map(t => t.profit || 0)) : 0;
          
          stats = {
            totalTrades: tradesWithProfit.length,
            winningTrades: winningTrades.length,
            losingTrades: losingTrades.length,
            winRate: tradesWithProfit.length ? (winningTrades.length / tradesWithProfit.length) * 100 : 0,
            totalProfit,
            averageProfit: tradesWithProfit.length ? totalProfit / tradesWithProfit.length : 0,
            largestWin,
            largestLoss
          };
        }
        
        return { 
          trades: formattedTrades,
          stats
        };
      } catch (error) {
        console.error(`Error fetching trade history for account ${accountId}:`, error);
        return { trades: [], stats: null };
      }
    },
    enabled: !!accountId && !!decryptedAccounts && !!decryptedAccounts[accountId],
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5분 캐시
  });
};
