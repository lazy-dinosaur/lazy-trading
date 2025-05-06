import { Skeleton } from "@/components/ui/skeleton";
import { TradeCard } from "@/components/ui/trade-card";
import { useAccounts } from "@/contexts/accounts/use";
import { ExchangeType } from "@/lib/accounts";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Position, Order } from "ccxt";
import { useState } from "react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router";
import { PositionTPSLDialog } from "./position-tp-sl-dialog";
import { Button } from "@/components/ui/button";
import { TRADING_COLORS } from "@/lib/constants";
import {
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Scissors,
  Settings,
  X,
  Loader2,
} from "lucide-react";
import { useTranslation } from "react-i18next";

export const PositionsList = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const exchange = searchParams.get("exchange") as ExchangeType | null;
  const accountId = searchParams.get("id");
  const symbol = searchParams.get("symbol"); // 현재 심볼 가져오기
  const { decryptedAccounts, isLoading: isAccountsLoading } = useAccounts();

  // TP/SL 다이얼로그 상태 관리
  const [isTPSLDialogOpen, setIsTPSLDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<{
    symbol: string;
    side: "long" | "short";
    entryPrice: number;
    markPrice: number;
    currentTakeProfitPrice?: number;
    currentStopLossPrice?: number;
  } | null>(null);

  const selectedAccount =
    accountId && decryptedAccounts ? decryptedAccounts[accountId] : null;

  // 포지션 데이터 가져오기
  const {
    data: positions,
    isLoading: isPositionsLoading,
    error,
  } = useQuery<Position[]>({
    queryKey: ["positions", exchange, accountId, symbol],
    queryFn: async () => {
      if (!selectedAccount || !selectedAccount.exchangeInstance) {
        throw new Error(t('trade.account_or_instance_not_found'));
      }

      let rawPositions: Position[];
      // Bybit이고 symbol이 있으면 해당 심볼만 조회, 아니면 전체 조회
      if (exchange === "bybit" && symbol) {
        rawPositions =
          await selectedAccount.exchangeInstance.ccxt.fetchPositions([symbol]);
      } else {
        rawPositions =
          await selectedAccount.exchangeInstance.ccxt.fetchPositions();
      }

      return rawPositions;
    },
    enabled: !!selectedAccount && !!selectedAccount.exchangeInstance,
    refetchInterval: 200, // 2초마다 갱신
    staleTime: Infinity,
  });

  // 오픈 주문 데이터 가져오기 (TP/SL 주문 정보를 위해)
  const { data: openOrders } = useQuery<Order[]>({
    queryKey: ["openOrders", exchange, accountId],
    queryFn: async () => {
      if (!selectedAccount || !selectedAccount.exchangeInstance) {
        throw new Error(t('trade.account_or_instance_not_found'));
      }
      return await selectedAccount.exchangeInstance.ccxt.fetchOpenOrders(
        symbol ?? undefined,
      );
    },
    enabled: !!selectedAccount && !!selectedAccount.exchangeInstance,
    refetchInterval: 200, // 5초마다 갱신
    staleTime: Infinity,
  });

  // 포지션별 TP/SL 주문 정보 추출
  const getPositionTPSL = (positionSymbol: string, positionSide: string) => {
    if (!openOrders)
      return { takeProfitPrice: undefined, stopLossPrice: undefined };

    const positionOrders = openOrders.filter(
      (order) =>
        order.symbol === positionSymbol &&
        (order.reduceOnly === true ||
          order.info?.reduceOnly === true ||
          order.info?.reduce_only === true),
    );

    // 타겟 가격 (일반 지정가 주문)
    const tpOrder = positionOrders.find(
      (order) =>
        order.type === "limit" &&
        ((positionSide === "long" && order.side === "sell") ||
          (positionSide === "short" && order.side === "buy")),
    );

    // 손절 가격 (스탑 주문 또는 스탑리밋 주문)
    const slOrder = positionOrders.find(
      (order) =>
        (order.type === "stop" ||
          order.type === "stop_market" ||
          order.type === "market" ||
          order.type === "stop_limit") &&
        ((positionSide === "long" && order.side === "sell") ||
          (positionSide === "short" && order.side === "buy")),
    );

    // stopPrice 또는 triggerPrice 속성이 있을 수 있음
    let stopPrice: number | undefined = undefined;

    if (slOrder) {
      if (typeof slOrder.stopPrice === "number") {
        stopPrice = slOrder.stopPrice;
      } else if (
        slOrder.info &&
        typeof slOrder.info.triggerPrice === "number"
      ) {
        stopPrice = slOrder.info.triggerPrice;
      } else if (typeof slOrder.price === "number") {
        stopPrice = slOrder.price;
      }
    }

    return {
      takeProfitPrice: tpOrder?.price,
      stopLossPrice: stopPrice,
    };
  };

  // 포지션 종료 함수
  const handleClosePosition = async (
    symbol: string,
    side: "long" | "short",
    size: number,
  ) => {
    if (!selectedAccount || !selectedAccount.exchangeInstance) {
      toast.error(t('trade.account_not_selected_or_instance_unavailable'));
      return;
    }

    const closeSide = side === "long" ? "sell" : "buy";
    let positionSize = size

    try {
      // 1. 기존 TP/SL 주문 취소
      try {
        // 기존 주문 가져오기
        const openOrders = await selectedAccount.exchangeInstance.ccxt.fetchOpenOrders(symbol);

        // TP/SL 주문 필터링 (reduceOnly가 true인 주문 + 포지션 방향에 맞는 주문)
        const tpslOrders = openOrders.filter(
          (o) =>
            (o.reduceOnly === true ||
              o.info?.reduceOnly === true ||
              o.info?.reduce_only === true) &&
            (side === "long" ? o.side === "sell" : o.side === "buy")
        );

        // 기존 TP/SL 주문 취소
        for (const order of tpslOrders) {
          await selectedAccount.exchangeInstance.ccxt.cancelOrder(order.id, symbol);
          console.log(`관련 주문 취소됨: ${order.id} (${order.type})`);
        }

        console.log(`${tpslOrders.length}개의 관련 주문 취소 완료`);
      } catch (error) {
        console.warn("관련 주문 취소 중 오류 발생:", error);
        // 진행은 계속합니다 (기존 주문이 없을 수도 있음)
      }

      // 2. 포지션 종료를 위한 파라미터 설정
      let params: any = { reduceOnly: true };

      // 비트겟 거래소인 경우 포지션 모드에 따라 oneWayMode와 hedged 설정
      if (selectedAccount.exchange === 'bitget') {
        // 계정의 포지션 모드 확인 (기본값: "oneway")
        const positionMode = selectedAccount.positionMode || "oneway";

        positionSize = positionSize / 100

        // 헷지 모드일 경우: oneWayMode: false, hedged: true
        // 원웨이 모드일 경우: oneWayMode: true, hedged: false
        params = {
          reduceOnly: true,
          hedged: positionMode === "hedge", // 헷지 모드면 true, 아니면 false
          oneWayMode: positionMode !== "hedge" // 헷지 모드면 false, 아니면 true
        };
        console.log(`비트겟 포지션 종료 - 모드: ${positionMode}, 파라미터:`, params);
      } else if (exchange === "binance") {
        // 바이낸스 헷지 모드: positionSide 사용
        params = {
          // reduceOnly: true,
          // positionSide: side === "long" ? "LONG" : "SHORT"
        };
      } else if (exchange === "bybit") {
        // 바이빗: 계정의 포지션 모드에 따라 다른 파라미터 사용
        const isHedgeMode = selectedAccount.positionMode === "hedge";

        if (isHedgeMode) {
          // 양방향 모드일 경우 positionIdx 사용
          // long: 1, short: 2
          params = {
            reduceOnly: true,
            positionIdx: side === "long" ? 1 : 2,
          };
        } else {
          // 단방향 모드일 경우 positionIdx: 0 사용
          params = {
            reduceOnly: true,
            positionIdx: 0,
          };
        }
      }

      // 3. 포지션 종료 주문 실행
      const order = await selectedAccount.exchangeInstance.ccxt.createOrder(
        symbol,
        "market", // 시장가
        closeSide, // 반대 방향
        positionSize, // 포지션 전체 크기
        undefined, // 시장가 주문 시 가격은 undefined
        params, // 동적으로 생성된 파라미터 전달
      );

      toast.success(
        t('trade.position_closed_successfully', { symbol, orderId: order.id }),
      );

      // 포지션 및 잔액 쿼리 무효화하여 데이터 새로고침
      queryClient.invalidateQueries({
        queryKey: ["positions", exchange, accountId],
      });
      queryClient.invalidateQueries({ queryKey: ["accountsBalance"] });
      
      // 주문 목록도 무효화하여 업데이트
      queryClient.invalidateQueries({
        queryKey: ["openOrders", exchange, accountId],
      });
    } catch (error: any) {
      console.error(t('trade.position_close_failed'), error);
      toast.error(t('trade.position_close_failed_with_error', { error: error.message }));
      throw error; // 에러를 다시 던져서 버튼 로딩 상태 해제
    }
  };

  // TP/SL 설정 다이얼로그 열기
  const handleOpenTPSLDialog = (
    symbol: string,
    side: "long" | "short",
    entryPrice: number,
    markPrice: number,
    stopLossPrice?: number | undefined,
    takeProfitPrice?: number | undefined,
  ) => {
    setSelectedPosition({
      symbol,
      side,
      entryPrice,
      markPrice,
      currentStopLossPrice: stopLossPrice,
      currentTakeProfitPrice: takeProfitPrice,
    });
    setIsTPSLDialogOpen(true);
  };

  const isLoading = isAccountsLoading || isPositionsLoading;

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="px-1 text-sm font-medium text-muted-foreground">
          {t('trade.active_positions')}
        </div>
        {/* 로딩 스켈레톤 */}
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
        {t('trade.position_loading_error')}: {error.message}
      </div>
    );
  }

  // 실제 포지션 데이터를 TradingItemCardProps 형태로 변환
  const filteredPositions = positions?.filter(
    (p) => p.contracts && p.contracts > 0, // 실제 계약 수가 있는 포지션만 필터링
  );

  const positionItems = filteredPositions?.map((p) => {
    // TP/SL 주문 정보 가져오기
    const { takeProfitPrice, stopLossPrice } = getPositionTPSL(
      p.symbol,
      p.side as string,
    );

    return {
      id: p.symbol + p.side, // 고유 ID 생성 (심볼 + 롱/숏)
      symbol: p.symbol,
      type: "position",
      isLong: p.side === "long",
      leverage: p.leverage ?? 0,
      entryPrice: p.entryPrice ?? 0,
      size: p.contracts ?? 0,
      profit: p.unrealizedPnl ?? 0,
      profitPercentage: p.percentage ?? 0,
      liquidationPrice: p.liquidationPrice,
      markPrice: p.markPrice,
      takeProfitPrice: takeProfitPrice,
      stopLossPrice: stopLossPrice,
      // onClosePosition 콜백 전달
      onClosePosition: () =>
        handleClosePosition(
          p.symbol,
          p.side === "long" ? "long" : "short",
          p.contracts ?? 0,
        ),
      // TP/SL 설정 다이얼로그 열기 콜백 전달
      onOpenTPSLDialog: () => {
        // null 체크 및 타입 안전성 확보
        const symbolStr = p.symbol;
        const sideType = p.side === "long" ? "long" : "short";
        const entryPriceVal = p.entryPrice ?? 0;
        const markPriceVal = p.markPrice ?? 0;

        // stopLossPrice와 takeProfitPrice를 명시적으로 number | undefined로 처리
        const stopLossPriceVal: number | undefined =
          typeof stopLossPrice === "number" ? stopLossPrice : undefined;
        const takeProfitPriceVal: number | undefined =
          typeof takeProfitPrice === "number" ? takeProfitPrice : undefined;

        handleOpenTPSLDialog(
          symbolStr,
          sideType,
          entryPriceVal,
          markPriceVal,
          stopLossPriceVal,
          takeProfitPriceVal,
        );
      },
      exchange,
      // accountId가 null이면 undefined를 전달
      accountId: accountId || undefined,
    };
  });

  return (
    <div className="space-y-2">
      <div className="px-1 text-sm font-medium text-muted-foreground">
        {t('trade.active_positions')} ({positionItems?.length ?? 0})
      </div>
      {positionItems && positionItems.length > 0 ? (
        positionItems.map((item) => <TradingItemCard key={item.id} {...item} />)
      ) : (
        <div className="py-8 text-center text-muted-foreground">
          {t('trade.no_active_positions')}
        </div>
      )}

      {/* TP/SL 설정 다이얼로그 */}
      {selectedPosition && selectedAccount && exchange && (
        <PositionTPSLDialog
          open={isTPSLDialogOpen}
          onOpenChange={setIsTPSLDialogOpen}
          position={selectedPosition}
          ccxtInstance={selectedAccount.exchangeInstance.ccxt}
          exchange={exchange}
          accountId={accountId}
        />
      )}
    </div>
  );
};

interface TradingItemCardProps {
  symbol: string;
  type?: string;
  leverage: number;
  entryPrice: number;
  size: number;
  profit: number;
  profitPercentage: number;
  isLong?: boolean;
  liquidationPrice?: number;
  markPrice?: number;
  onClosePosition?: () => Promise<void>; // 포지션 종료 콜백 추가
  onOpenTPSLDialog?: () => void; // TP/SL 설정 다이얼로그 열기 콜백 추가
  exchange?: ExchangeType | null; // 거래소 정보 추가
  accountId?: string; // 계정 ID 추가 - null은 undefined로 처리
  stopLossPrice?: number;
  takeProfitPrice?: number;
}

const TradingItemCard = ({
  symbol,
  leverage,
  entryPrice,
  size,
  profit,
  profitPercentage,
  isLong = true,
  onClosePosition, // onClosePosition prop 추가
  onOpenTPSLDialog, // TP/SL 설정 다이얼로그 열기 콜백
  stopLossPrice,
  takeProfitPrice,
}: TradingItemCardProps) => {
  const { t } = useTranslation();
  const [isClosing, setIsClosing] = useState(false); // 종료 로딩 상태 추가
  const isPositive = profit > 0;
  const directionIcon = isLong ? (
    <ArrowUpRight className="w-4 h-4 text-green-500" />
  ) : (
    <ArrowDownRight className="w-4 h-4 text-red-500" />
  );

  return (
    <TradeCard>
      <div className="flex flex-col gap-2">
        {/* 상단 영역: 심볼, 방향, 레버리지 */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold">{symbol}</span>
              <div
                className={`px-2 py-0.5 rounded text-xs font-medium inline-flex items-center gap-1 ${isLong
                  ? "bg-green-500/10 text-green-500"
                  : "bg-red-500/10 text-red-500"
                  }`}
              >
                {directionIcon}
                {isLong ? t('trade.long') : t('trade.short')}
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-accent/50">
                {leverage}x
              </span>
            </div>
            <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
              <span>{t('trade.entry_price')}: ${entryPrice}</span>
              <span>•</span>
              <span>
                {t('trade.size')}: {size} {symbol.replace("USDT", "")}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div
              className={`text-base font-semibold ${isPositive ? TRADING_COLORS.POSITIVE : TRADING_COLORS.NEGATIVE
                }`}
            >
              {isPositive ? "+" : ""}
              {profit.toFixed(2)} USD
            </div>
            <div
              className={`text-xs px-2 py-0.5 rounded-full ${isPositive ? "bg-green-500/10" : "bg-red-500/10"
                }`}
            >
              {t('trade.pnl')}: {isPositive ? "+" : ""}
              {profitPercentage.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* 중간 영역: TP/SL 정보 (설정된 경우에만 표시) */}
        {(stopLossPrice || takeProfitPrice) && (
          <div className="grid grid-cols-2 gap-4 pt-1 border-t border-border/30 text-xs">
            {takeProfitPrice && (
              <div className="flex items-center gap-1">
                <Target className="w-3 h-3 text-green-500" />
                <span className="text-muted-foreground">{t('trade.target')}:</span>
                <span className="font-medium">${takeProfitPrice}</span>
              </div>
            )}
            {stopLossPrice && (
              <div className="flex items-center gap-1">
                <Scissors className="w-3 h-3 text-red-500" />
                <span className="text-muted-foreground">{t('trade.stoploss')}:</span>
                <span className="font-medium">${stopLossPrice}</span>
              </div>
            )}
          </div>
        )}

        {/* 버튼 영역 */}
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/30">
          {/* TP/SL 설정 버튼 */}
          {onOpenTPSLDialog && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onOpenTPSLDialog();
              }}
            >
              <Settings className="w-3 h-3 mr-1" />
              {t('trade.target_stoploss')}
            </Button>
          )}

          {/* 포지션 종료 버튼 */}
          {onClosePosition && (
            <Button
              variant="destructive"
              size="sm"
              className="h-7 text-xs"
              onClick={async (e) => {
                e.stopPropagation();
                setIsClosing(true);
                try {
                  await onClosePosition();
                } catch {
                  // 실패 시 toast는 PositionsList에서 처리
                } finally {
                  setIsClosing(false);
                }
              }}
              disabled={isClosing}
            >
              {isClosing ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  {t('trade.closing')}
                </>
              ) : (
                <>
                  <X className="w-3 h-3 mr-1" />
                  {t('trade.close_position')}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </TradeCard>
  );
};
