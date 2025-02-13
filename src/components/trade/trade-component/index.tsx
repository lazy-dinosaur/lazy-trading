import { TradingAction } from "./action";
import { TradeInfo } from "./info";

export const TradeComponent = () => {
  return (
    <div className="flex w-full h-48 h-lg:h-64 h-xl:h-80 items-center justify-between gap-1 h-lg:gap-2 h-xl:gap-3">
      <TradeInfo />
      <TradingAction />
    </div>
  );
};
