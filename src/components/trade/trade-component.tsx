import { Button } from "../ui/button";

export const TradeComponent = () => {
  return (
    <div className="w-full h-32">
      <div className="h-3/5"></div>
      <div className="w-full flex justify-between h-2/5 items-center">
        <Button variant={"long"} className="w-1/2 mx-2 opacity-90">
          LONG
        </Button>
        <Button variant={"short"} className="w-1/2 mx-2 opacity-90">
          SHORT
        </Button>
      </div>
    </div>
  );
};
