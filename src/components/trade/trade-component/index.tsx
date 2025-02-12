import { TradingAction } from "./action";
import { TradeInfo } from "./info";

export const TradeComponent = () => {
  return (
    <div className="flex w-full min-h-min items-center justify-between gap-3">
      <TradeInfo />
      <TradingAction />
    </div>
  );
};
