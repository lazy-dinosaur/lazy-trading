import { useTrade } from "@/contexts/trade/use";
import { ExchangeType } from "@/lib/accounts";
import { Link, useSearchParams } from "react-router";

export const TradeInfo = () => {
  const [searchParams] = useSearchParams();
  const { tradeInfo, balanceInfo } = useTrade();
  const exchange = searchParams.get("exchange") as ExchangeType;

  return (
    <div className="h-full w-full flex flex-col items-center justify-between gap-2">
      <div className="flex w-full items-center justify-between px-2 ">
        <span className="text-sm text-muted-foreground capitalize">
          Trading Info
        </span>
        <div className="gap-2 text-xs flex">
          <span className="space-x-1">
            <span className="text-muted-foreground">Maker:</span>
            <span>{tradeInfo?.tradingfee?.maker}</span>
          </span>
          <span className="space-x-1">
            <span className="text-muted-foreground">Taker:</span>
            <span>{tradeInfo?.tradingfee?.taker}</span>
          </span>
        </div>
      </div>
      <div className="w-full h-full rounded-md p-2 border">
        <div className="w-full h-full grid grid-cols-5 grid-rows-6">
          <span></span>
          <span className="col-span-2 text-muted-foreground font-semibold flex items-center justify-center mb-2">
            LONG
          </span>
          <span className="col-span-2 text-muted-foreground font-semibold flex items-center justify-center mb-2">
            SHORT
          </span>
          <span className="col-span-1 row-span-2 text-muted-foreground font-semibold flex items-center justify-center">
            S/L
          </span>
          <span className="col-span-2 col-row-1 flex items-center justify-center text-sm">
            {tradeInfo?.long.stoploss.formatted}
          </span>
          <span className="col-span-2 col-row-1 flex items-center justify-center text-sm">
            {tradeInfo?.short.stoploss.formatted}
          </span>
          <span className="col-span-2 col-row-1 flex items-center justify-center mb-2 text-sm">
            {tradeInfo?.long.stoploss.percentage}%
          </span>
          <span className="col-span-2 col-row-1 flex items-center justify-center mb-2 text-sm">
            {tradeInfo?.short.stoploss.percentage}%
          </span>
          <span className="col-span-1 row-span-2 text-muted-foreground font-semibold flex items-center justify-center">
            T/P
          </span>
          <span className="col-span-2 col-row-1 flex items-center justify-center text-sm">
            {tradeInfo?.long.target.formatted}
          </span>
          <span className="col-span-2 col-row-1 flex items-center justify-center text-sm">
            {tradeInfo?.short.target.formatted}
          </span>
          <span className="col-span-2 col-row-1 flex items-center justify-center mb-2 text-sm">
            {tradeInfo?.long.target.percentage}%
          </span>
          <span className="col-span-2 col-row-1 flex items-center justify-center mb-2 text-sm">
            {tradeInfo?.short.target.percentage}%
          </span>
          <span className="col-span-1 row-span-1 text-muted-foreground font-semibold flex items-center justify-center">
            Leverage
          </span>
          <span className="col-span-2 flex items-center justify-center text-sm">
            {tradeInfo?.long.leverage}x
          </span>
          <span className="col-span-2 flex items-center justify-center text-sm">
            {tradeInfo?.short.leverage}x
          </span>
        </div>
      </div>
      {balanceInfo ? (
        <span className="grid grid-cols-7 grid-rows-3 w-full border rounded-md p-2">
          <span className="text-xs text-muted-foreground capitalize">
            balance
          </span>
          <span className="text-xs text-muted-foreground capitalize col-span-2">
            total
          </span>
          <span className="text-xs text-muted-foreground capitalize col-span-2">
            free
          </span>
          <span className="text-xs text-muted-foreground capitalize col-span-2">
            used
          </span>
          <span className="text-xs text-muted-foreground capitalize ">
            {balanceInfo.base.name ?? 0}
          </span>
          {/* 바이낸스 밸런스 데이터 토탈이랑 프리 반대로 나옴 임시 해결 */}
          {exchange == "binance" ? (
            <>
              <span className="text-sm capitalize col-span-2">
                {balanceInfo.base.free ?? 0}
              </span>
              <span className="text-sm capitalize col-span-2">
                {balanceInfo.base.total ?? 0}
              </span>
            </>
          ) : (
            <>
              <span className="text-sm capitalize col-span-2">
                {balanceInfo.base.total ?? 0}
              </span>
              <span className="text-sm capitalize col-span-2">
                {balanceInfo.base.free ?? 0}
              </span>
            </>
          )}
          <span className="text-sm capitalize col-span-2">
            {balanceInfo.base.used ?? 0}
          </span>
          <span className="text-xs text-muted-foreground capitalize">
            TOTAL
          </span>
          <span className="text-sm capitalize col-span-2">
            {balanceInfo.usd.total}
          </span>
          <span className="text-sm capitalize col-span-2">
            {balanceInfo.usd.free}
          </span>
          <span className="text-sm capitalize col-span-2">
            {balanceInfo.usd.used}
          </span>
        </span>
      ) : (
        <Link
          to={`/account/add?exchange=${exchange}`}
          className="w-full border rounded-md p-2 font-bold text-xl text-center flex flex-col hover:underline"
        >
          <span>{`No Apikey Detected for ${exchange}.`}</span>
          <span>Click here to add Apikey.</span>
        </Link>
      )}
    </div>
  );
};
