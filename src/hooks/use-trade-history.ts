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
  filter?: TradeHistoryFilter
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
          `Fetching trade history for account: ${accountId} (${account.exchange})`
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

        // 1. 데이터 동시 요청 (Ledger & Closed Orders)
        const [ledgerEntries, closedOrders] = await Promise.all([
          account.exchangeInstance.ccxt.has["fetchLedger"]
            ? account.exchangeInstance.ccxt
                .fetchLedger(undefined, since, undefined, { period }) // limit 없이 최대한 가져옴
                .catch((err: any) => {
                  console.error(`Error fetching ledger: ${err.message}`);
                  return [];
                })
            : Promise.resolve([]), // fetchLedger 미지원 시 빈 배열
          account.exchangeInstance.ccxt
            .fetchClosedOrders(undefined, since, undefined, { period }) // limit 없이 최대한 가져옴
            .catch((err: any) => {
              console.error(`Error fetching closed orders: ${err.message}`);
              return [];
            }),
        ]);

        console.log(
          `Fetched ${ledgerEntries.length} ledger entries and ${closedOrders.length} closed orders for period ${period}`
        );

        // --- DEBUG LOGGING START ---
        if (closedOrders.length > 0) {
          console.log("DEBUG: First closedOrder object:", closedOrders[0]);
        }
        if (ledgerEntries.length > 0) {
          console.log(
            "DEBUG: First 5 ledgerEntry objects:",
            ledgerEntries.slice(0, 5)
          );
        }
        // --- DEBUG LOGGING END ---

        if (closedOrders.length === 0) {
          console.log("No closed orders found, returning empty history.");
          return { trades: [], stats: null };
        }

        // 2. 종료된 주문 ID 집합 생성
        const closedOrderIds = new Set(closedOrders.map((order) => order.id));

        // 3. 관련 Ledger 항목 필터링 및 그룹화
        const ledgerByOrderId = new Map<string, any[]>();
        const fundingFees: any[] = [];

        ledgerEntries.forEach((entry) => {
          // referenceId 또는 info.orderId 중 하나라도 종료된 주문 ID와 일치하는지 확인
          const orderIdFromRef = entry.referenceId;
          const orderIdFromInfo = entry.info?.orderId;
          let matchedOrderId: string | undefined = undefined;

          if (orderIdFromRef && closedOrderIds.has(orderIdFromRef)) {
            matchedOrderId = orderIdFromRef;
          } else if (orderIdFromInfo && closedOrderIds.has(orderIdFromInfo)) {
            matchedOrderId = orderIdFromInfo;
          }

          // 종료된 주문과 관련된 'fee' 항목만 그룹화 (trade 항목은 PnL 계산에 사용 안 함)
          if (matchedOrderId && entry.type === "fee") {
            if (!ledgerByOrderId.has(matchedOrderId)) {
              ledgerByOrderId.set(matchedOrderId, []);
            }
            ledgerByOrderId.get(matchedOrderId)?.push(entry);
          }
          // 펀딩비 항목
          else if (entry.type === "funding") {
            fundingFees.push(entry);
          }
        });

        console.log(
          `Grouped ledger entries (fees only) for ${ledgerByOrderId.size} closed orders.`
        );

        // 4 & 5. 그룹별 PnL 계산 및 TradeHistoryItem 생성
        const tradeHistoryItems: TradeHistoryItem[] = [];

        closedOrders.forEach((order) => {
          const orderId = order.id;
          const relatedLedgerFeeEntries = ledgerByOrderId.get(orderId) || [];

          // 주문 정보에서 기본 데이터 추출
          const baseInfo = {
            id: order.id,
            timestamp: order.timestamp || 0,
            datetime: order.datetime || new Date(order.timestamp).toISOString(),
            symbol: order.symbol || "",
            side: (order.side as "buy" | "sell") || "buy",
            price: order.average || order.price || 0, // 평균 체결가 우선 사용
            amount: order.filled || order.amount || 0, // 체결된 수량 우선 사용
            cost: order.cost || (order.price || 0) * (order.filled || 0),
            orderId: order.id,
            type: order.type || "unknown", // 주문 타입 (limit/market)
            isClosingPosition: true, // closedOrder 이므로 종료로 간주
          };

          // Ledger에서 수수료 정보 추출
          let totalFeeFromLedger = 0;
          let feeCurrencyFromLedger = "USD"; // 기본값
          relatedLedgerFeeEntries.forEach((entry) => {
            // fee 항목만 처리
            if (entry.type === "fee") {
              totalFeeFromLedger += entry.amount; // 수수료는 항상 비용(-) 이므로 양수로 합산
              feeCurrencyFromLedger = entry.currency || feeCurrencyFromLedger;
            }
          });

          // API 제공 PnL 확인 (더 정확할 수 있음) - 필드 확장
          let apiPnl: number | undefined = undefined;
          if (order.info) {
            // Bybit 및 기타 거래소에서 사용될 수 있는 PnL 필드 목록 확장
            const pnlFields = [
              "realizedPnl", // Common CCXT
              "closedPnl", // Bybit v5
              "profit", // Common
              "realisedPnl", // Older CCXT/Exchanges
              "cumRealisedPnl", // Bybit specific?
              "closedPnlNV",
              "realisedPnlNV",
              "cumRealisedPnlNV",
            ];
            for (const field of pnlFields) {
              // 숫자 또는 숫자로 변환 가능한 문자열인지 확인
              const pnlValue = order.info[field];
              if (
                pnlValue !== undefined &&
                pnlValue !== null &&
                pnlValue !== "" &&
                !isNaN(Number(pnlValue))
              ) {
                apiPnl = parseFloat(String(pnlValue));
                console.log(
                  `[Order ${orderId}] Found PnL in order.info.${field}: ${apiPnl}`
                );
                break;
              }
            }
          }

          // 펀딩비 계산 (단순 합산, 기간 매칭은 복잡하여 생략)
          const relevantFundingFees = fundingFees
            .filter(
              (fee) =>
                fee.currency === baseInfo.symbol.split(":")[1]?.split("/")[0] ||
                fee.currency === baseInfo.symbol.split("/")[0]
            )
            .reduce(
              (sum, fee) =>
                sum + (fee.direction === "in" ? fee.amount : -fee.amount),
              0
            );

          // 최종 PnL 결정 (API PnL 우선, 없으면 undefined)
          let finalPnl: number | undefined;
          let finalFee: number;
          let feeCurrency: string;

          if (apiPnl !== undefined) {
            finalPnl = apiPnl + relevantFundingFees; // API PnL + 펀딩비
            // 수수료 결정: order.fee 우선, 없으면 Ledger 기반 수수료 사용
            if (order.fee?.cost !== undefined && order.fee?.cost !== null) {
              finalFee = order.fee.cost;
              feeCurrency = order.fee.currency || feeCurrencyFromLedger;
            } else {
              finalFee = totalFeeFromLedger;
              feeCurrency = feeCurrencyFromLedger;
            }
            console.log(
              `[Order ${orderId}] Using API PnL (${apiPnl}) + Funding (${relevantFundingFees}) = ${finalPnl}. Fee used: ${finalFee} ${feeCurrency} (Source: ${
                order.fee?.cost !== undefined ? "Order" : "Ledger"
              })`
            );
          } else {
            // API PnL을 찾지 못한 경우, PnL은 undefined
            finalPnl = undefined;
            // 수수료는 Ledger 기반 사용
            finalFee = totalFeeFromLedger;
            feeCurrency = feeCurrencyFromLedger;
            console.warn(
              `[Order ${orderId}] API PnL not found. Final PnL is undefined. Funding=${relevantFundingFees}, Fee=${finalFee} ${feeCurrency}. Order Info:`,
              order.info
            );
          }

          // 수익률 계산 (PnL / 진입 비용) - 진입 비용 추정이 어려움
          const profitPercent: number | undefined = undefined;

          tradeHistoryItems.push({
            ...baseInfo,
            profit: finalPnl,
            profitPercent: profitPercent, // 수익률 계산은 보류
            fee: { cost: finalFee, currency: feeCurrency },
          });
        });

        // 6. 최종 목록 생성 및 통계
        tradeHistoryItems.sort((a, b) => b.timestamp - a.timestamp);

        let stats: TradeHistoryStats | null = null;
        if (tradeHistoryItems.length > 0) {
          const tradesWithProfit = tradeHistoryItems.filter(
            (t) => t.profit !== undefined
          );
          const winningTrades = tradesWithProfit.filter(
            (t) => (t.profit || 0) > 0
          );
          const losingTrades = tradesWithProfit.filter(
            (t) => (t.profit || 0) < 0
          );

          const totalProfit = tradesWithProfit.reduce(
            (sum, t) => sum + (t.profit || 0),
            0
          );
          const largestWin = winningTrades.length
            ? Math.max(...winningTrades.map((t) => t.profit || 0))
            : 0;
          const largestLoss = losingTrades.length
            ? Math.min(...losingTrades.map((t) => t.profit || 0))
            : 0;

          stats = {
            totalTrades: tradesWithProfit.length, // PnL 계산된 거래 수
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

          console.log(
            `Calculated stats based on ${tradesWithProfit.length} closed orders with PnL for period ${period}.`
          );
        }

        // 최종적으로 화면에 표시할 거래 내역은 limit 적용
        const limitedTradeHistory = tradeHistoryItems.slice(0, limit);
        console.log(
          `Displaying ${limitedTradeHistory.length} trade history items.`
        );

        return {
          trades: limitedTradeHistory,
          stats,
        };
      } catch (error) {
        console.error(
          `Error fetching trade history for account ${accountId}:`,
          error
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
