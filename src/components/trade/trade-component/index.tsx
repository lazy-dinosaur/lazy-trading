import { TradingAction } from "./action";
import { TradeInfo } from "./info";

export const TradeComponent = () => {
  return (
    <div className="w-full h-full flex-1 flex flex-col space-y-3">
      <div className="flex w-full min-h-max items-center justify-between gap-3">
        <TradeInfo />
        <TradingAction />
      </div>
      <div className=" w-full h-full flex">ddd</div>
    </div>
  );
};
