import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TradeCard } from "@/components/ui/trade-card";
import { useAccounts } from "@/contexts/accounts/use";
import { ExchangeType } from "@/lib/accounts";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Order } from "ccxt";
import { Clock, Zap, X } from "lucide-react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router";

export const OrdersList = () => {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const exchange = searchParams.get("exchange") as ExchangeType | null;
  const accountId = searchParams.get("id");
  const symbol = searchParams.get("symbol");
  const { decryptedAccounts, isLoading: isAccountsLoading } = useAccounts();

  const selectedAccount =
    accountId && decryptedAccounts ? decryptedAccounts[accountId] : null;

  const {
    data: openOrders,
    isLoading: isOrdersLoading,
    error,
  } = useQuery<Order[]>({
    queryKey: ["openOrders", exchange, accountId],
    queryFn: async () => {
      if (!selectedAccount || !selectedAccount.exchangeInstance) {
        throw new Error("선택된 계정 또는 인스턴스를 찾을 수 없습니다."); // 한글 변경
      }
      return await selectedAccount.exchangeInstance.ccxt.fetchOpenOrders(
        symbol ?? undefined,
      );
    },
    enabled: !!selectedAccount && !!selectedAccount.exchangeInstance,
    refetchInterval: 200, // 5초마다 주문 정보 갱신
    staleTime: Infinity,
  });

  // 주문 취소 핸들러
  const handleCancelOrder = async (orderId: string, symbol: string) => {
    if (!selectedAccount?.exchangeInstance) {
      toast.error("계정 인스턴스를 사용할 수 없습니다."); // 한글 변경
      return;
    }

    try {
      await selectedAccount.exchangeInstance.ccxt.cancelOrder(orderId, symbol);
      toast.success(`주문 #${orderId} 취소됨`); // 한글 변경
      queryClient.invalidateQueries({
        queryKey: ["openOrders", exchange, accountId],
      });
    } catch (error: any) {
      toast.error(`주문 취소 실패: ${error.message}`); // 한글 변경
    }
  };

  const isLoading = isAccountsLoading || isOrdersLoading;

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="px-1 text-sm font-medium text-muted-foreground">
          대기 중인 주문 {/* 한글 변경 */}
        </div>
        {[...Array(3)].map((_, i) => (
          <TradeCard key={i}>
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <Skeleton className="w-24 h-5" />
                <Skeleton className="w-32 h-4" />
              </div>
              <div className="flex flex-col items-end gap-1">
                <Skeleton className="w-20 h-5" />
                <Skeleton className="w-16 h-4" />
              </div>
            </div>
          </TradeCard>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center text-red-500">
        <div>주문 로딩 실패</div> {/* 한글 변경 */}
        <Button
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={() =>
            queryClient.refetchQueries({
              queryKey: ["openOrders", exchange, accountId],
            })
          }
        >
          재시도 {/* 한글 변경 */}
        </Button>
      </div>
    );
  }

  const orderItems = openOrders?.map((order) => {
    const isLong = order.side === "buy";
    const filledPercentage = order.filled
      ? (order.filled / order.amount) * 100
      : 0;
    const isPartiallyFilled = filledPercentage > 0 && filledPercentage < 100;

    return {
      id: order.id,
      symbol: order.symbol,
      type: order.type,
      isLong,
      leverage: order.info?.leverage || 0,
      entryPrice: order.price ?? 0,
      size: order.amount,
      profit: 0,
      profitPercentage: 0,
      onCancelOrder: () => handleCancelOrder(order.id, order.symbol),
      meta: {
        status: order.status,
        filled: order.filled,
        remaining: order.remaining,
        filledPercentage,
        isPartiallyFilled,
        createdAt: order.timestamp ? new Date(order.timestamp) : undefined,
      },
    };
  });

  return (
    <div className="space-y-2">
      <div className="px-1 text-sm font-medium text-muted-foreground">
        대기 중인 주문 ({orderItems?.length ?? 0}) {/* 한글 변경 */}
      </div>
      {orderItems && orderItems.length > 0 ? (
        orderItems.map((item) => (
          <TradeCard key={item.id}>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{item.symbol}</span>
                  <div
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      item.isLong
                        ? "bg-green-500/10 text-green-500"
                        : "bg-red-500/10 text-red-500"
                    }`}
                  >
                    {item.isLong ? "롱" : "숏"} {/* 한글 변경 */}
                  </div>
                  <div className="text-xs px-2 py-0.5 rounded bg-accent/50">
                    {item.type === "limit" ? (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 지정가
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3" /> 시장가
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-sm font-medium">
                  ${item.entryPrice.toFixed(2)}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  크기: {item.size} {item.symbol.replace("USDT", "")} {/* 한글 변경 */}
                </span>
                <span>{item.meta.filledPercentage.toFixed(1)}% 체결</span>
              </div>

              {item.meta.isPartiallyFilled && (
                <div className="h-1.5 bg-accent rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${item.meta.filledPercentage}%` }}
                  />
                </div>
              )}

              <div className="flex justify-end pt-1 border-t border-border/30">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    item.onCancelOrder();
                  }}
                >
                  <X className="w-3 h-3 mr-1" />
                  주문 취소
                </Button>
              </div>
            </div>
          </TradeCard>
        ))
      ) : (
        <div className="py-8 text-center text-muted-foreground">
          대기 중인 주문 없음 {/* 한글 변경 */}
        </div>
      )}
    </div>
  );
};
