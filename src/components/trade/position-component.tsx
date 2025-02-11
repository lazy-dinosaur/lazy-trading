import { useState } from "react";
import { cn } from "@/lib/utils";

type TabType = "orders" | "positions" | "assets";

interface PositionComponentProps {
  isCompact?: boolean;
}

export const PositionComponent = ({ isCompact }: PositionComponentProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("orders");

  return (
    <div
      className={cn(
        "w-full flex flex-col h-full",
        // isCompact &&
        //   "hover:transform hover:translate-y-0 transition-transform duration-300",
      )}
    >
      {/* 고정된 헤더 */}
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

      {/* 스크롤 가능한 컨텐츠 */}
      <div className="flex-1 overflow-y-auto min-h-0 h-full">
        <div className="w-full space-y-4 p-4">
          {activeTab === "orders" && <OrdersList />}
          {activeTab === "positions" && <PositionsList />}
          {activeTab === "assets" && <AssetsList />}
        </div>
      </div>
    </div>
  );
};

const TabButton = ({
  children,
  isActive,
  onClick,
}: {
  children: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 text-sm font-medium transition-colors",
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
        <div
          key={i}
          className="w-full p-4 border rounded-lg bg-card flex justify-between items-center"
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">BTCUSDT</span>
              <span className="text-sm text-green-500">Long</span>
              <span className="text-sm text-muted-foreground">20x</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Entry: $43,500 • Size: 0.123 BTC
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="text-lg font-semibold text-green-500">+$543.21</div>
            <div className="text-sm text-muted-foreground">PNL: +2.45%</div>
          </div>
        </div>
      ))}
    </>
  );
};

const PositionsList = () => {
  return (
    <>
      {Array.from({ length: 15 }).map((_, i) => (
        <div
          key={i}
          className="w-full p-4 border rounded-lg bg-card flex justify-between items-center"
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">BTCUSDT</span>
              <span className="text-sm text-green-500">Long</span>
              <span className="text-sm text-muted-foreground">20x</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Entry: $43,500 • Size: 0.123 BTC
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="text-lg font-semibold text-green-500">+$543.21</div>
            <div className="text-sm text-muted-foreground">PNL: +2.45%</div>
          </div>
        </div>
      ))}
    </>
  );
};

const AssetsList = () => {
  return (
    <>
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="w-full p-4 border rounded-lg bg-card flex justify-between items-center"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">USDT</span>
          </div>
          <div className="text-lg">1,234.56</div>
        </div>
      ))}
    </>
  );
};
