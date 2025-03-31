import { useState } from "react";
import { cn } from "@/lib/utils";
import { TRADING_COLORS } from "@/lib/constants";
import { TradeCard } from "@/components/ui/trade-card";
import {
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  BarChart3,
  Wallet,
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
    <div className="w-full flex flex-col h-full bg-card">
      {/* 개선된 탭 네비게이션 */}
      <div className="flex border-b sticky top-0 bg-background z-10 px-2">
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
          : "text-muted-foreground",
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
}: TradingItemCardProps) => {
  const isPositive = profit > 0;
  const directionIcon = isLong ? (
    <ArrowUpRight className="h-4 w-4 text-green-500" />
  ) : (
    <ArrowDownRight className="h-4 w-4 text-red-500" />
  );

  return (
    <TradeCard>
      <div className="flex justify-between items-center">
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
          <div className="text-xs text-muted-foreground flex gap-2 mt-1">
            <span>Entry: ${entryPrice}</span>
            <span>•</span>
            <span>
              Size: {size} {symbol.replace("USDT", "")}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div
            className={`text-base font-semibold ${isPositive ? TRADING_COLORS.POSITIVE : TRADING_COLORS.NEGATIVE}`}
          >
            {isPositive ? "+" : ""}
            {profit.toFixed(2)} USD
          </div>
          <div
            className={`text-xs px-2 py-0.5 rounded-full ${isPositive ? "bg-green-500/10" : "bg-red-500/10"}`}
          >
            PNL: {isPositive ? "+" : ""}
            {profitPercentage.toFixed(2)}%
          </div>
        </div>
      </div>
    </TradeCard>
  );
};

// 자산 카드 컴포넌트
const AssetCard = ({ asset, amount }: AssetCardProps) => (
  <TradeCard variant="compact">
    <div className="flex justify-between items-center py-1">
      <div className="flex items-center gap-2">
        <span className="font-medium">{asset}</span>
      </div>
      <div className="font-semibold">{amount.toFixed(2)}</div>
    </div>
  </TradeCard>
);

// 주문 목록 컴포넌트
const OrdersList = () => {
  // 샘플 데이터
  const orderItems = [
    {
      id: 1,
      symbol: "BTCUSDT",
      type: "order",
      isLong: true,
      leverage: 20,
      entryPrice: 44312.5,
      size: 0.135,
      profit: 0,
      profitPercentage: 0,
    },
    {
      id: 2,
      symbol: "ETHUSDT",
      type: "order",
      isLong: false,
      leverage: 10,
      entryPrice: 3023.75,
      size: 1.5,
      profit: 0,
      profitPercentage: 0,
    },
    {
      id: 3,
      symbol: "SOLUSDT",
      type: "order",
      isLong: true,
      leverage: 5,
      entryPrice: 142.35,
      size: 10,
      profit: 0,
      profitPercentage: 0,
    },
  ];

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-muted-foreground px-1">
        Active Orders
      </div>
      {orderItems.length > 0 ? (
        orderItems.map((item) => <TradingItemCard key={item.id} {...item} />)
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No active orders
        </div>
      )}
    </div>
  );
};

// 포지션 목록 컴포넌트
const PositionsList = () => {
  // 샘플 데이터
  const positionItems = [
    {
      id: 1,
      symbol: "BTCUSDT",
      type: "position",
      isLong: true,
      leverage: 20,
      entryPrice: 43500,
      size: 0.123,
      profit: 543.21,
      profitPercentage: 2.45,
    },
    {
      id: 2,
      symbol: "ETHUSDT",
      type: "position",
      isLong: false,
      leverage: 15,
      entryPrice: 2950.75,
      size: 2.5,
      profit: -125.3,
      profitPercentage: -0.85,
    },
    {
      id: 3,
      symbol: "SOLUSDT",
      type: "position",
      isLong: true,
      leverage: 10,
      entryPrice: 138.45,
      size: 15,
      profit: 210.8,
      profitPercentage: 1.32,
    },
  ];

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-muted-foreground px-1">
        Open Positions
      </div>
      {positionItems.length > 0 ? (
        positionItems.map((item) => <TradingItemCard key={item.id} {...item} />)
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No open positions
        </div>
      )}
    </div>
  );
};

// 자산 목록 컴포넌트
const AssetsList = () => {
  // 샘플 데이터
  const assetItems = [
    { id: 1, asset: "USDT", amount: 1234.56 },
    { id: 2, asset: "BTC", amount: 0.0542 },
    { id: 3, asset: "ETH", amount: 1.235 },
    { id: 4, asset: "SOL", amount: 25.75 },
  ];

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-muted-foreground px-1">
        Available Assets
      </div>
      {assetItems.length > 0 ? (
        assetItems.map((item) => <AssetCard key={item.id} {...item} />)
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No assets available
        </div>
      )}
    </div>
  );
};
