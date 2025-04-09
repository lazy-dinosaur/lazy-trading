import { useAccounts } from "@/contexts/accounts/use";
import { useQuery } from "@tanstack/react-query";

export interface TradeHistoryItem {
  id: string;
  timestamp: number;
  datetime: string;
  symbol: string;
  side: "buy" | "sell";
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
  orderId?: string; // 관련 주문 ID
  isClosingPosition?: boolean; // 포지션 종료 거래 여부
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
  period?: "7d" | "30d" | "90d" | "all";
  limit?: number;
}

export const useTradeHistory = (
  accountId?: string,
  filter?: TradeHistoryFilter,
) => {
  const limit = filter?.limit || 100;
  const period = filter?.period || "7d";
  const { decryptedAccounts } = useAccounts();

  return useQuery({
    queryKey: ["tradeHistory", accountId, limit, period],
    queryFn: async (): Promise<{
      trades: TradeHistoryItem[];
      stats: TradeHistoryStats | null;
    }> => {
      if (!accountId || !decryptedAccounts || !decryptedAccounts[accountId]) {
        return { trades: [], stats: null };
      }

      const account = decryptedAccounts[accountId];

      try {
        console.log(
          `Fetching trade history for account: ${accountId} (${account.exchange})`,
        );

        // 기간에 따른 시간 계산
        const now = new Date().getTime();
        let since: number | undefined;

        switch (period) {
          case "7d":
            since = now - 7 * 24 * 60 * 60 * 1000;
            break;
          case "30d":
            since = now - 30 * 24 * 60 * 60 * 1000;
            break;
          case "90d":
            since = now - 90 * 24 * 60 * 60 * 1000;
            break;
          case "all":
            since = undefined; // 전체 기간
            break;
          default:
            since = now - 7 * 24 * 60 * 60 * 1000;
        }

        // 거래 내역 및 종료된 주문 가져오기
        const [myTrades, closedOrders] = await Promise.all([
          account.exchangeInstance.ccxt
            .fetchMyTrades(undefined, since, limit)
            .catch((err) => {
              console.error(`Error fetching myTrades: ${err.message}`);
              return [];
            }),
          account.exchangeInstance.ccxt
            .fetchClosedOrders(undefined, since, limit)
            .catch((err) => {
              console.error(`Error fetching closedOrders: ${err.message}`);
              return [];
            }),
        ]);

        console.log(
          `Fetched ${myTrades.length} trades and ${closedOrders.length} closed orders for period ${period}`,
        );

        // 종료된 주문 매핑 생성
        const ordersMap = new Map();
        closedOrders.forEach((order) => {
          if (order.id) {
            ordersMap.set(order.id, order);
          }
        });

        // 각 거래가 포지션 청산 거래인지 확인
        myTrades.forEach((trade) => {
          if (trade.info && trade.info.createType === "CreateByClosing") {
            console.log(`Found position closing trade: ${trade.id}`);
          }
        });

        // 심볼별 포지션 추적 (같은 심볼에 대한 매수/매도 거래 페어링)
        const symbolPositions = new Map();

        // 1단계: 거래 내역 형식 변환 및 기본 정보 추출
        const formattedTrades: TradeHistoryItem[] = myTrades.map((trade) => {
          // 기본 거래 정보 추출
          let profit = undefined;
          let profitPercent = undefined;
          let relatedOrder = null;
          let isBybitClosingTrade = false;

          // 관련 주문 찾기 (trade.order가 있는 경우)
          if (trade.order && ordersMap.has(trade.order)) {
            relatedOrder = ordersMap.get(trade.order);
          }

          // 바이빗 특화 처리: createType 필드를 통한 청산 거래 식별
          if (trade.info && trade.info.createType === "CreateByClosing") {
            isBybitClosingTrade = true;

            // 바이빗 거래소의 closedPnl 필드에서 수익 정보 추출
            if (trade.info.closedPnl !== undefined) {
              profit = parseFloat(String(trade.info.closedPnl));
            }
          }

          // 다양한 거래소 API 필드에서 PnL 정보 추출 시도
          if (profit === undefined && trade.info) {
            // 다양한 필드명으로 수익 검색
            const pnlFields = [
              "realizedPnl",
              "realizedProfit",
              "closed_pnl",
              "realized_pnl",
              "pnl",
              "realisedPnl",
              "closedPnl",
              "profit",
            ];

            for (const field of pnlFields) {
              if (trade.info[field] !== undefined) {
                profit = parseFloat(String(trade.info[field]));
                break;
              }
            }

            // 수익률 정보도 확인
            if (trade.info.roi !== undefined) {
              profitPercent = parseFloat(String(trade.info.roi)) * 100;
            } else if (trade.info.pnlRate !== undefined) {
              profitPercent = parseFloat(String(trade.info.pnlRate)) * 100;
            }
          }

          // 관련 주문에서 PnL 정보 확인
          if (profit === undefined && relatedOrder && relatedOrder.info) {
            const orderInfo = relatedOrder.info;

            // 다양한 필드명으로 수익 검색
            const pnlFields = [
              "realizedPnl",
              "realizedProfit",
              "closed_pnl",
              "realized_pnl",
              "profit",
              "closedPnl",
            ];

            for (const field of pnlFields) {
              if (orderInfo[field] !== undefined) {
                profit = parseFloat(String(orderInfo[field]));
                break;
              }
            }
          }

          // 형식화된 거래 정보 반환
          const formattedTrade: TradeHistoryItem = {
            id: trade.id || String(trade.timestamp),
            timestamp: trade.timestamp || 0,
            datetime: trade.datetime || new Date().toISOString(),
            symbol: trade.symbol || "",
            side: (trade.side as "buy" | "sell") || "buy",
            price: trade.price || 0,
            amount: trade.amount || 0,
            cost: trade.cost || 0,
            fee: trade.fee
              ? {
                  cost: typeof trade.fee.cost === "number" ? trade.fee.cost : 0,
                  currency: trade.fee.currency || "USD",
                }
              : undefined,
            type: trade.type || "unknown",
            profit,
            profitPercent,
            orderId: trade.order || undefined,
            isClosingPosition:
              isBybitClosingTrade ||
              (trade.info &&
                (trade.info.createType === "CreateByClosing" ||
                  trade.info.reduce_only === true ||
                  trade.info.closePosition === true)) ||
              false,
          };

          // 포지션 추적을 위해 거래 정보 저장
          // 심볼 기준으로 거래를 그룹화
          if (!symbolPositions.has(trade.symbol)) {
            symbolPositions.set(trade.symbol, []);
          }

          symbolPositions.get(trade.symbol).push({
            original: trade,
            formatted: formattedTrade,
          });

          return formattedTrade;
        });

        // 2단계: 포지션 매칭을 통한 수익 계산 (API에서 제공되지 않는 경우)
        for (const trades of symbolPositions.values()) {
          // 시간순으로 정렬
          trades.sort(
            (a: any, b: any) => a.original.timestamp - b.original.timestamp,
          );

          // 같은 심볼에서 진입과 청산 거래 매칭하기
          // 간단한 접근 방식: 매수 이후 매도, 매도 이후 매수가 나오면 포지션이 청산된 것으로 가정
          let position = null;

          for (const trade of trades) {
            const { formatted } = trade;

            // 이미 수익 정보가 있으면 건너뛰기
            if (formatted.profit !== undefined) continue;

            // 포지션이 없는 경우, 현재 거래로 새 포지션 시작
            if (position === null) {
              position = {
                side: formatted.side,
                entryPrice: formatted.price,
                amount: formatted.amount,
                cost: formatted.cost,
                timestamp: formatted.timestamp,
                fee: formatted.fee?.cost || 0,
              };
              continue;
            }

            // 반대 방향 거래가 나타나면 포지션 청산으로 처리
            if (position.side !== formatted.side) {
              // 포지션 청산으로 표시
              formatted.isClosingPosition = true;

              // 수익 계산
              if (position.side === "buy") {
                // 매수 진입 -> 매도 청산
                const profit =
                  (formatted.price - position.entryPrice) *
                  Math.min(position.amount, formatted.amount);
                // 수수료 차감
                const totalFee = position.fee + (formatted.fee?.cost || 0);
                formatted.profit = profit - totalFee;

                // 수익률 계산
                formatted.profitPercent = (profit / position.cost) * 100;
              } else {
                // 매도 진입 -> 매수 청산
                const profit =
                  (position.entryPrice - formatted.price) *
                  Math.min(position.amount, formatted.amount);
                // 수수료 차감
                const totalFee = position.fee + (formatted.fee?.cost || 0);
                formatted.profit = profit - totalFee;

                // 수익률 계산
                formatted.profitPercent = (profit / position.cost) * 100;
              }

              // 포지션 사이즈 조정 (부분 청산의 경우)
              position.amount -= formatted.amount;

              // 포지션이 완전히 청산되었으면 null로 설정
              if (position.amount <= 0) {
                position = null;
              }
            } else {
              // 같은 방향의 거래는 포지션 추가로 평균 진입가 계산
              const totalAmount = position.amount + formatted.amount;
              position.entryPrice =
                (position.entryPrice * position.amount +
                  formatted.price * formatted.amount) /
                totalAmount;
              position.amount = totalAmount;
              position.cost += formatted.cost;
              position.fee += formatted.fee?.cost || 0;
            }
          }
        }

        // 최종 거래 내역을 시간 역순으로 정렬
        formattedTrades.sort((a, b) => b.timestamp - a.timestamp);

        // 필터링된 거래가 많을 경우 제한
        const limitedTrades = formattedTrades.slice(0, limit);

        // 거래 통계 계산
        let stats: TradeHistoryStats | null = null;

        if (limitedTrades.length > 0) {
          const tradesWithProfit = limitedTrades.filter(
            (t) => t.profit !== undefined,
          );
          const winningTrades = tradesWithProfit.filter(
            (t) => (t.profit || 0) > 0,
          );
          const losingTrades = tradesWithProfit.filter(
            (t) => (t.profit || 0) < 0,
          );

          const totalProfit = tradesWithProfit.reduce(
            (sum, t) => sum + (t.profit || 0),
            0,
          );
          const largestWin = winningTrades.length
            ? Math.max(...winningTrades.map((t) => t.profit || 0))
            : 0;
          const largestLoss = losingTrades.length
            ? Math.min(...losingTrades.map((t) => t.profit || 0))
            : 0;

          stats = {
            totalTrades: tradesWithProfit.length,
            winningTrades: winningTrades.length,
            losingTrades: losingTrades.length,
            winRate: tradesWithProfit.length
              ? (winningTrades.length / tradesWithProfit.length) * 100
              : 0,
            totalProfit,
            averageProfit: tradesWithProfit.length
              ? totalProfit / tradesWithProfit.length
              : 0,
            largestWin,
            largestLoss,
          };
        }

        console.log(
          `Calculated profit for ${limitedTrades.filter((t) => t.profit !== undefined).length} trades`,
        );

        return {
          trades: limitedTrades,
          stats,
        };
      } catch (error) {
        console.error(
          `Error fetching trade history for account ${accountId}:`,
          error,
        );
        return { trades: [], stats: null };
      }
    },
    enabled:
      !!accountId && !!decryptedAccounts && !!decryptedAccounts[accountId],
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5분 캐시
  });
};
