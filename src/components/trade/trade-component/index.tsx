import { TradingAction } from "./action";
import { TradeInfo } from "./info";

export const TradeComponent = () => {
  return (
    <div className="flex flex-col md:flex-row w-full min-h-[180px] h-auto lg:h-full items-stretch justify-between gap-2 md:gap-3 p-2 border rounded-md shadow-sm">
      <div className="w-full md:w-2/3 flex-grow">
        <TradeInfo />
      </div>
      <div className="w-full md:w-1/3 flex-none">
        <TradingAction />
      </div>
    </div>
  );
};
