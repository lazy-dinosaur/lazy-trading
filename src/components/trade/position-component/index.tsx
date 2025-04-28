import { cn } from "@/lib/utils";
import { BarChart3, Layers, Wallet } from "lucide-react";
import { useState } from "react";
import { OrdersList } from "./order-list";
import { AssetsList } from "./assets-list";
import { PositionsList } from "./position-list";
import { useTranslation } from "react-i18next";

type TabType = "orders" | "positions" | "assets";

export const PositionComponent = () => {
  const { t } = useTranslation();
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
          {t('trade.positions')}
        </TabButton>
        <TabButton
          isActive={activeTab === "orders"}
          onClick={() => setActiveTab("orders")}
          icon={<Layers className="w-4 h-4 mr-1" />}
        >
          {t('trade.orders')}
        </TabButton>
        <TabButton
          isActive={activeTab === "assets"}
          onClick={() => setActiveTab("assets")}
          icon={<Wallet className="w-4 h-4 mr-1" />}
        >
          {t('trade.assets')}
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
