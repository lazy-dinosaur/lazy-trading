import { useState } from "react"; // 중복 제거
import { useSearchParams } from "react-router"; // 중복 제거
import { useQuery, useQueryClient } from "@tanstack/react-query"; // 중복 제거 및 useQueryClient 유지
import { Position, Order } from "ccxt";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { TRADING_COLORS } from "@/lib/constants";
import { useAccounts } from "@/contexts/accounts/use";
import { ExchangeType } from "@/lib/accounts";
import { Skeleton } from "@/components/ui/skeleton";
import { TradeCard } from "@/components/ui/trade-card";
import { Button } from "@/components/ui/button"; // Button 추가
import {
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  BarChart3,
  Wallet,
  X, // X 아이콘 추가
} from "lucide-react";

type TabType = "orders" | "positions" | "assets";

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
}

interface AssetCardProps {
  asset: string;
  amount: number;
}

/**
 * Position component with improved tabbed navigation and card layout
 */
export const PositionComponent = () => {
  const [activeTab, setActiveTab] = useState<TabType>("positions");

  return (
    <div className="flex flex-col w-full h-full bg-card">
      {/* 개선된 탭 네비게이션 */}
      <div className="sticky top-0 z-10 flex px-2 border-b bg-background">
        <TabButton
          isActive={activeTab === "positions"}
          onClick={() => setActiveTab("positions")}
          icon={<BarChart3 className="w-4 h-4 mr-1" />}
        >
          Positions
        </TabButton>
        <TabButton
          isActive={activeTab === "orders"}
          onClick={() => setActiveTab("orders")}
          icon={<Layers className="w-4 h-4 mr-1" />}
        >
          Orders
        </TabButton>
        <TabButton
          isActive={activeTab === "assets"}
          onClick={() => setActiveTab("assets")}
          icon={<Wallet className="w-4 h-4 mr-1" />}
        >
          Assets
        </TabButton>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-background">
        <div className="w-full p-2 space-y-2">
          {activeTab === "orders" && <OrdersList />}
          {activeTab === "positions" && <PositionsList />}
          {activeTab === "assets" && <AssetsList />}
        </div>
      </div>
    </div>
  );
};

interface TabButtonProps {
  children: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}

const TabButton = ({ children, isActive, onClick, icon }: TabButtonProps) => {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation(); // 버블링 방지
        onClick();
      }}
      className={cn(
        "px-3 py-2 text-sm font-medium transition-colors rounded-t-md flex items-center",
        "hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50",
        isActive
          ? "border-b-2 border-primary text-primary bg-accent/30"
          : "text-muted-foreground"
      )}
    >
      {icon}
      {children}
    </button>
  );
};

// 트레이딩 카드 컴포넌트 (주문 및 포지션용)
const TradingItemCard = ({
  symbol,
  leverage,
  entryPrice,
  size,
  profit,
  profitPercentage,
  isLong = true,
  onClosePosition, // onClosePosition prop 추가
}: TradingItemCardProps) => {
  const [isClosing, setIsClosing] = useState(false); // 종료 로딩 상태 추가
  const isPositive = profit > 0;
  const directionIcon = isLong ? (
    <ArrowUpRight className="w-4 h-4 text-green-500" />
  ) : (
    <ArrowDownRight className="w-4 h-4 text-red-500" />
  );

  return (
    <TradeCard>
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold">{symbol}</span>
            <div
              className={`px-2 py-0.5 rounded text-xs font-medium inline-flex items-center gap-1 ${
                isLong
                  ? "bg-green-500/10 text-green-500"
                  : "bg-red-500/10 text-red-500"
              }`}
            >
              {directionIcon}
              {isLong ? "Long" : "Short"}
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-accent/50">
              {leverage}x
            </span>
          </div>
          <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
            <span>Entry: ${entryPrice}</span>
            <span>•</span>
            <span>
              Size: {size} {symbol.replace("USDT", "")}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div
            className={`text-base font-semibold ${
              isPositive ? TRADING_COLORS.POSITIVE : TRADING_COLORS.NEGATIVE
            }`}
          >
            {isPositive ? "+" : ""}
            {profit.toFixed(2)} USD
          </div>
          <div
            className={`text-xs px-2 py-0.5 rounded-full ${
              isPositive ? "bg-green-500/10" : "bg-red-500/10"
            }`}
          >
            PNL: {isPositive ? "+" : ""}
            {profitPercentage.toFixed(2)}%
          </div>
          {/* 시장가 종료 버튼 (onClosePosition이 있을 때만 렌더링) */}
          {onClosePosition && (
            <Button
              variant="destructive"
              // size="xs" 제거
              className="mt-1 px-2 py-0.5 h-auto text-xs" // size="xs" 제거 후 스타일 유지 위해 text-xs 등 유지
              onClick={async (e) => {
                e.stopPropagation(); // 카드 클릭 이벤트 방지
                setIsClosing(true);
                try {
                  await onClosePosition();
                  // 성공 시 toast는 PositionsList에서 처리
                } catch {
                  // error 변수 제거
                  // 실패 시 toast는 PositionsList에서 처리
                } finally {
                  setIsClosing(false);
                }
              }}
              disabled={isClosing}
            >
              <X className="w-3 h-3 mr-1" />
              {isClosing ? "Closing..." : "Close"}
            </Button>
          )}
        </div>
      </div>
    </TradeCard>
  );
};

// 자산 카드 컴포넌트
const AssetCard = ({ asset, amount }: AssetCardProps) => (
  <TradeCard variant="compact">
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        <span className="font-medium">{asset}</span>
      </div>
      <div className="font-semibold">{amount.toFixed(2)}</div>
    </div>
  </TradeCard>
);

// 주문 목록 컴포넌트 (실제 데이터 연동)
const OrdersList = () => {
  const [searchParams] = useSearchParams();
  const exchange = searchParams.get("exchange") as ExchangeType | null;
  const accountId = searchParams.get("id");
  console.log("[Debug] Account ID from URL:", accountId); // accountId 로그 추가
  const { decryptedAccounts, isLoading: isAccountsLoading } = useAccounts();

  const selectedAccount =
    accountId && decryptedAccounts ? decryptedAccounts[accountId] : null;
  console.log("[Debug] Selected Account:", selectedAccount); // selectedAccount 로그 추가

  const {
    data: openOrders,
    isLoading: isOrdersLoading,
    error,
  } = useQuery<Order[]>({
    queryKey: ["openOrders", exchange, accountId],
    queryFn: async () => {
      if (!selectedAccount || !selectedAccount.exchangeInstance) {
        throw new Error("Selected account or instance not found");
      }
      // 모든 심볼의 미체결 주문을 가져옵니다.
      return await selectedAccount.exchangeInstance.ccxt.fetchOpenOrders();
    },
    enabled: !!selectedAccount && !!selectedAccount.exchangeInstance,
    refetchInterval: 300, // 5초마다 주문 정보 갱신
  });

  const isLoading = isAccountsLoading || isOrdersLoading;

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="px-1 text-sm font-medium text-muted-foreground">
          Active Orders
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
                {/* 주문 카드에는 수익률 표시 안 함 */}
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
        Error fetching open orders: {error.message}
      </div>
    );
  }

  // 실제 주문 데이터를 TradingItemCardProps 형태로 변환
  // 주문 데이터는 포지션과 구조가 다르므로 필요한 정보만 매핑
  const orderItems = openOrders?.map((order) => ({
    id: order.id,
    symbol: order.symbol,
    type: order.type, // 'limit', 'market' 등
    isLong: order.side === "buy", // 선물에서는 buy가 long, sell이 short에 해당
    leverage: 0, // 주문 자체에는 레버리지 정보가 없을 수 있음
    entryPrice: order.price ?? 0, // 지정가 주문의 가격
    size: order.amount, // 주문 수량
    profit: 0, // 주문 상태에서는 PNL 없음
    profitPercentage: 0, // 주문 상태에서는 PNL 없음
  }));

  return (
    <div className="space-y-2">
      <div className="px-1 text-sm font-medium text-muted-foreground">
        Active Orders ({orderItems?.length ?? 0})
      </div>
      {orderItems && orderItems.length > 0 ? (
        orderItems.map((item) => <TradingItemCard key={item.id} {...item} />)
      ) : (
        <div className="py-8 text-center text-muted-foreground">
          No active orders
        </div>
      )}
    </div>
  );
};

// 포지션 목록 컴포넌트 (실제 데이터 연동)
const PositionsList = () => {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const exchange = searchParams.get("exchange") as ExchangeType | null;
  const accountId = searchParams.get("id");
  const symbol = searchParams.get("symbol"); // 현재 심볼 가져오기
  console.log("[Debug] Account ID from URL:", accountId);
  console.log("[Debug] Symbol from URL:", symbol); // 심볼 로그 추가
  const { decryptedAccounts, isLoading: isAccountsLoading } = useAccounts();

  const selectedAccount =
    accountId && decryptedAccounts ? decryptedAccounts[accountId] : null;

  // 포지션 종료 함수
  const handleClosePosition = async (
    symbol: string,
    side: "long" | "short",
    size: number
  ) => {
    if (!selectedAccount || !selectedAccount.exchangeInstance) {
      // l; 제거
      toast.error("Account not selected or instance not available.");
      return;
    }

    const closeSide = side === "long" ? "sell" : "buy";

    // 거래소별 파라미터 설정
    let params: any = {};
    if (exchange === "binance") {
      // 바이낸스 헷지 모드: positionSide 사용
      params = { positionSide: side === "long" ? "LONG" : "SHORT" };
    } else if (exchange === "bybit") {
      // 바이빗 단방향 모드: reduceOnly와 positionIdx: 0 사용
      params = {
        reduceOnly: true,
        positionIdx: 0, // 단방향 모드는 0
      };
    } else {
      // 기타 거래소: reduceOnly 사용 (기본값)
      params = { reduceOnly: true };
    }

    console.log(
      `[Debug] Creating order for ${exchange} - Symbol: ${symbol}, Side: ${closeSide}, Size: ${size}, Params:`,
      params
    ); // 파라미터 로그 추가

    try {
      const order = await selectedAccount.exchangeInstance.ccxt.createOrder(
        symbol,
        "market", // 시장가
        closeSide, // 반대 방향
        size, // 포지션 전체 크기
        undefined, // 시장가 주문 시 가격은 undefined
        params // 동적으로 생성된 파라미터 전달
      );
      console.log(`[Debug] Order creation response for ${exchange}:`, order); // 응답 로그 추가
      toast.success(
        `Position ${symbol} closed successfully. Order ID: ${order.id}`
      );
      // 포지션 및 잔액 쿼리 무효화하여 데이터 새로고침
      queryClient.invalidateQueries({
        queryKey: ["positions", exchange, accountId],
      });
      queryClient.invalidateQueries({ queryKey: ["accountsBalance"] }); // 전체 잔액 쿼리 무효화
    } catch (error: any) {
      console.error("Failed to close position:", error);
      toast.error(`Failed to close position: ${error.message}`);
      throw error; // 에러를 다시 던져서 버튼 로딩 상태 해제
    }
  };

  const {
    data: positions,
    isLoading: isPositionsLoading,
    error,
  } = useQuery<Position[]>({
    queryKey: ["positions", exchange, accountId, symbol], // queryKey에 symbol 추가
    queryFn: async () => {
      console.log("[Debug] queryFn for fetchPositions called.");
      if (!selectedAccount || !selectedAccount.exchangeInstance) {
        console.error("[Debug] Account or instance not found inside queryFn.");
        throw new Error("Selected account or instance not found");
      }

      let rawPositions: Position[];
      // Bybit이고 symbol이 있으면 해당 심볼만 조회, 아니면 전체 조회
      if (exchange === "bybit" && symbol) {
        console.log(`[Debug] Fetching positions for Bybit symbol: ${symbol}`);
        rawPositions =
          await selectedAccount.exchangeInstance.ccxt.fetchPositions([symbol]);
      } else {
        console.log("[Debug] Fetching all positions for exchange:", exchange);
        rawPositions =
          await selectedAccount.exchangeInstance.ccxt.fetchPositions();
      }

      console.log("[Debug] Raw positions from API:", rawPositions);
      return rawPositions;
    },
    enabled: !!selectedAccount && !!selectedAccount.exchangeInstance,
    refetchInterval: 2000, // 5초 -> 2초로 변경
  });

  const isLoading = isAccountsLoading || isPositionsLoading;

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="px-1 text-sm font-medium text-muted-foreground">
          Open Positions
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
        Error fetching positions: {error.message}
      </div>
    );
  }

  // 실제 포지션 데이터를 TradingItemCardProps 형태로 변환
  const filteredPositions = positions?.filter(
    (p) => p.contracts && p.contracts > 0 // 실제 계약 수가 있는 포지션만 필터링
  );
  console.log("[Debug] Filtered positions:", filteredPositions); // 필터링된 데이터 로그 추가

  const positionItems = filteredPositions?.map((p) => ({
    id: p.symbol + p.side, // 고유 ID 생성 (심볼 + 롱/숏)
    symbol: p.symbol,
    type: "position",
    isLong: p.side === "long",
    leverage: p.leverage ?? 0,
    entryPrice: p.entryPrice ?? 0,
    size: p.contracts ?? 0, // size 대신 contracts 사용 (선물 기준)
    profit: p.unrealizedPnl ?? 0,
    profitPercentage: p.percentage ?? 0,
    liquidationPrice: p.liquidationPrice,
    markPrice: p.markPrice,
    // onClosePosition 콜백 전달
    onClosePosition: () =>
      handleClosePosition(
        p.symbol,
        p.side === "long" ? "long" : "short",
        p.contracts ?? 0
      ),
  }));

  return (
    <div className="space-y-2">
      <div className="px-1 text-sm font-medium text-muted-foreground">
        Open Positions ({positionItems?.length ?? 0})
      </div>
      {positionItems && positionItems.length > 0 ? (
        positionItems.map((item) => <TradingItemCard key={item.id} {...item} />)
      ) : (
        <div className="py-8 text-center text-muted-foreground">
          No open positions
        </div>
      )}
    </div>
  );
};

// 자산 목록 컴포넌트 (실제 데이터 연동)
const AssetsList = () => {
  const [searchParams] = useSearchParams();
  const accountId = searchParams.get("id");
  const { accountsBalance, isLoading: isAccountsLoading } = useAccounts();

  const currentBalance = accountId
    ? accountsBalance?.[accountId]?.balance
    : null;

  // USDT, BTC, ETH 등 주요 자산만 표시하거나, 잔액이 0 이상인 자산만 표시
  const assetItems = currentBalance
    ? Object.entries(currentBalance)
        .filter(
          ([asset, balance]) =>
            balance.total > 0 && !["USD", "USDC"].includes(asset) // USD, USDC 제외 및 잔액 0 초과 필터링
        )
        .map(([asset, balance], index) => ({
          id: index,
          asset: asset,
          amount: balance.total, // 사용 가능 잔액(free) 대신 총 잔액(total) 표시
        }))
    : [];

  if (isAccountsLoading) {
    return (
      <div className="space-y-2">
        <div className="px-1 text-sm font-medium text-muted-foreground">
          Available Assets
        </div>
        {[...Array(4)].map((_, i) => (
          <TradeCard key={i} variant="compact">
            <div className="flex items-center justify-between py-1">
              <Skeleton className="w-16 h-5" />
              <Skeleton className="w-20 h-5" />
            </div>
          </TradeCard>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="px-1 text-sm font-medium text-muted-foreground">
        Available Assets ({assetItems.length})
      </div>
      {assetItems.length > 0 ? (
        assetItems.map((item) => <AssetCard key={item.id} {...item} />)
      ) : (
        <div className="py-8 text-center text-muted-foreground">
          No assets available
        </div>
      )}
    </div>
  );
};
