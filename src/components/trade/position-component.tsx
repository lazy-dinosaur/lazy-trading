import { useState } from "react";
import { cn } from "@/lib/utils";

type TabType = "orders" | "positions" | "assets";

export const PositionComponent = () => {
  const [activeTab, setActiveTab] = useState<TabType>("orders");

  return (
    <div className="w-full flex flex-col space-y-2">
      {/* 헤더 */}
      <div className="flex border-b">
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

      {/* 컨텐츠 */}
      <div className="w-full space-y-4">
        {activeTab === "orders" && <OrdersList />}
        {activeTab === "positions" && <PositionsList />}
        {activeTab === "assets" && <AssetsList />}
      </div>
    </div>
  );
};

const TabButton = ({ 
  children, 
  isActive, 
  onClick 
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
          : "text-muted-foreground"
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
