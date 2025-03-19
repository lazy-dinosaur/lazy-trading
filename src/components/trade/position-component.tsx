import { useState } from "react";
import { cn } from "@/lib/utils";
import { SPACING, TEXT_SIZE, TRADING_COLORS } from "@/lib/constants";
import { TradeCard } from "@/components/ui/trade-card";

type TabType = "orders" | "positions" | "assets";

interface PositionComponentProps {
  isCompact?: boolean;
}

/**
 * Position component with tabbed navigation
 */
export const PositionComponent = ({ isCompact }: PositionComponentProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("orders");

  return (
    <div className="w-full flex flex-col h-full">
      {/* Fixed header */}
      <div
        className={cn(
          "flex border-b sticky top-0 bg-background z-10",
          isCompact && "cursor-pointer",
        )}
      >
        <TabButton
          isActive={activeTab === "orders"}
          onClick={() => setActiveTab("orders")}
        >
          Orders
        </TabButton>
        <TabButton
          isActive={activeTab === "positions"}
          onClick={() => setActiveTab("positions")}
        >
          Positions
        </TabButton>
        <TabButton
          isActive={activeTab === "assets"}
          onClick={() => setActiveTab("assets")}
        >
          Assets
        </TabButton>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0 h-full scrollbar-thin scrollbar-thumb-border scrollbar-track-background">
        <div className={`w-full space-y-${SPACING.LG} py-6`}>
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
}

const TabButton = ({ children, isActive, onClick }: TabButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        `px-${SPACING.LG} py-${SPACING.MD} text-${TEXT_SIZE.SM} font-medium transition-colors`,
        "hover:text-primary",
        isActive
          ? "border-b-2 border-primary text-primary"
          : "text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
};

const OrdersList = () => {
  return (
    <>
      {Array.from({ length: 10 }).map((_, i) => (
        <TradeCard key={i}>
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">BTCUSDT</span>
                <span className={`text-sm ${TRADING_COLORS.LONG}`}>Long</span>
                <span className="text-sm text-muted-foreground">20x</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Entry: $43,500 • Size: 0.123 BTC
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className={`text-lg font-semibold ${TRADING_COLORS.POSITIVE}`}>+$543.21</div>
              <div className="text-sm text-muted-foreground">PNL: +2.45%</div>
            </div>
          </div>
        </TradeCard>
      ))}
    </>
  );
};

const PositionsList = () => {
  return (
    <>
      {Array.from({ length: 15 }).map((_, i) => (
        <TradeCard key={i}>
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">BTCUSDT</span>
                <span className={`text-sm ${TRADING_COLORS.LONG}`}>Long</span>
                <span className="text-sm text-muted-foreground">20x</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Entry: $43,500 • Size: 0.123 BTC
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className={`text-lg font-semibold ${TRADING_COLORS.POSITIVE}`}>+$543.21</div>
              <div className="text-sm text-muted-foreground">PNL: +2.45%</div>
            </div>
          </div>
        </TradeCard>
      ))}
    </>
  );
};

const AssetsList = () => {
  return (
    <>
      {Array.from({ length: 20 }).map((_, i) => (
        <TradeCard key={i} variant="compact">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">USDT</span>
            </div>
            <div className="text-lg">1,234.56</div>
          </div>
        </TradeCard>
      ))}
    </>
  );
};
