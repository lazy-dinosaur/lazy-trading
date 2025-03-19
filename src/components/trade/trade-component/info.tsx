import { useTrade } from "@/contexts/trade/use";
import { ExchangeType } from "@/lib/accounts";
import { Link, useSearchParams } from "react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { SPACING, TEXT_SIZE } from "@/lib/constants";

/**
 * Exchange-specific balance display component
 */
interface BalanceDisplayProps {
  exchange: ExchangeType;
  baseTotal: number | string;
  baseFree: number | string;
}

const BalanceDisplay = ({ exchange, baseTotal, baseFree }: BalanceDisplayProps) => {
  // Different exchanges may have different data structures
  // This component centralizes the exchange-specific display logic
  if (exchange === "binance") {
    return (
      <>
        <span className={`text-${TEXT_SIZE.SM} capitalize col-span-2`}>
          {baseFree}
        </span>
        <span className={`text-${TEXT_SIZE.SM} capitalize col-span-2`}>
          {baseTotal}
        </span>
      </>
    );
  }
  
  return (
    <>
      <span className={`text-${TEXT_SIZE.SM} capitalize col-span-2`}>
        {baseTotal}
      </span>
      <span className={`text-${TEXT_SIZE.SM} capitalize col-span-2`}>
        {baseFree}
      </span>
    </>
  );
};

export const TradeInfo = () => {
  const [searchParams] = useSearchParams();
  const {
    tradeInfo,
    balanceInfo,
    tickerQuery,
    marketInfoQuery,
    isAccountsLoading,
  } = useTrade();

  const { exchangeAccounts } = useTrade();

  const exchange = searchParams.get("exchange") as ExchangeType;

  const isTradeInfoLoading =
    tickerQuery.isLoading || marketInfoQuery.isLoading || !tradeInfo;

  const isBalanceLoading =
    !exchangeAccounts && (isAccountsLoading || !balanceInfo);

  return (
    <div className={`h-full w-2/3 flex flex-col items-center gap-${SPACING.SM} h-lg:gap-${SPACING.MD} h-xl:gap-${SPACING.LG} overflow-hidden`}>
      <div className="flex-none flex w-full items-center justify-between px-2">
        <span className={`text-${TEXT_SIZE.SM} text-muted-foreground capitalize`}>
          Trading Info
        </span>
        <div className={`gap-${SPACING.MD} text-${TEXT_SIZE.XS} flex`}>
          {isTradeInfoLoading ? (
            <>
              <Skeleton className={`h-2 w-16 h-lg:h-3 h-lg:w-18 h-xl:h-4 h-xl:w-20`} />
              <Skeleton className={`h-2 w-16 h-lg:h-3 h-lg:w-18 h-xl:h-4 h-xl:w-20`} />
            </>
          ) : (
            <>
              <span className={`space-x-${SPACING.XS}`}>
                <span className="text-muted-foreground">Maker:</span>
                <span>{tradeInfo?.tradingfee?.maker}</span>
              </span>
              <span className={`space-x-${SPACING.XS}`}>
                <span className="text-muted-foreground">Taker:</span>
                <span>{tradeInfo?.tradingfee?.taker}</span>
              </span>
            </>
          )}
        </div>
      </div>
      {isTradeInfoLoading ? (
        <div className="flex-[2] w-full rounded-md p-1 h-lg:p-2 h-xl:p-3 border">
          <div className="w-full grid grid-cols-5 grid-rows-4 gap-0 h-lg:gap-1 h-xl:gap-2">
            <span className="col-span-2 text-muted-foreground font-semibold flex items-center justify-center">
              LONG
            </span>
            <span></span>
            <span className="col-span-2 text-muted-foreground font-semibold flex items-center justify-center">
              SHORT
            </span>
            <span className="col-span-2 flex flex-col items-center justify-center text-sm gap-0.5">
              <Skeleton className="h-2 w-24 h-lg:h-3 h-lg:w-28 h-xl:h-4 h-xl:w-32" />
              <Skeleton className="h-2 w-24 h-lg:h-3 h-lg:w-28 h-xl:h-4 h-xl:w-32" />
            </span>
            <span className="col-span-1 text-muted-foreground font-semibold flex items-center justify-center">
              S/L
            </span>
            <span className="col-span-2 flex flex-col items-center justify-center text-sm gap-0.5">
              <Skeleton className="h-2 w-24 h-lg:h-3 h-lg:w-28 h-xl:h-4 h-xl:w-32" />
              <Skeleton className="h-2 w-24 h-lg:h-3 h-lg:w-28 h-xl:h-4 h-xl:w-32" />
            </span>

            <span className="col-span-2 flex flex-col items-center justify-center text-sm gap-0.5">
              <Skeleton className="h-2 w-24 h-lg:h-3 h-lg:w-28 h-xl:h-4 h-xl:w-32" />
              <Skeleton className="h-2 w-24 h-lg:h-3 h-lg:w-28 h-xl:h-4 h-xl:w-32" />
            </span>
            <span className="col-span-1 text-muted-foreground font-semibold flex items-center justify-center">
              T/P
            </span>
            <span className="col-span-2 flex flex-col items-center justify-center text-sm gap-0.5">
              <Skeleton className="h-2 w-24 h-lg:h-3 h-lg:w-28 h-xl:h-4 h-xl:w-32" />
              <Skeleton className="h-2 w-24 h-lg:h-3 h-lg:w-28 h-xl:h-4 h-xl:w-32" />
            </span>

            <span className="col-span-2 flex items-center justify-center text-sm">
              <Skeleton className="h-2 w-8 h-lg:h-3 h-lg:w-10 h-xl:h-4 h-xl:w-12" />
            </span>
            <span className="col-span-1 row-span-1 text-muted-foreground font-semibold flex items-center justify-center">
              Leverage
            </span>
            <span className="col-span-2 flex items-center justify-center text-sm">
              <Skeleton className="h-2 w-8 h-lg:h-3 h-lg:w-10 h-xl:h-4 h-xl:w-12" />
            </span>
          </div>
        </div>
      ) : (
        <div className="flex-[2] w-full rounded-md p-1 h-lg:p-2 h-xl:p-3 border min-h-0">
          <div className="w-full h-full grid grid-cols-5 grid-rows-4 gap-0 h-lg:gap-1 h-xl:gap-2">
            <span className="col-span-2 text-muted-foreground font-semibold flex items-center justify-center">
              LONG
            </span>
            <span></span>
            <span className="col-span-2 text-muted-foreground font-semibold flex items-center justify-center">
              SHORT
            </span>
            <span className="col-span-2 flex flex-col items-center justify-center text-sm">
              <span>{tradeInfo?.long.stoploss.formatted}</span>
              <span>({tradeInfo?.long.stoploss.percentage}%)</span>
            </span>
            <span className="col-span-1 text-muted-foreground font-semibold flex items-center justify-center">
              S/L
            </span>
            <span className="col-span-2 flex flex-col items-center justify-center text-sm">
              <span>{tradeInfo?.short.stoploss.formatted}</span>
              <span>({tradeInfo?.short.stoploss.percentage}%)</span>
            </span>
            <span className="col-span-2 flex flex-col items-center justify-center text-sm">
              <span>{tradeInfo?.long.target.formatted}</span>
              <span>({tradeInfo?.long.target.percentage}%)</span>
            </span>
            <span className="col-span-1 text-muted-foreground font-semibold flex items-center justify-center">
              T/P
            </span>
            <span className="col-span-2 flex flex-col items-center justify-center text-sm">
              <span>{tradeInfo?.short.target.formatted}</span>
              <span>({tradeInfo?.short.target.percentage}%)</span>
            </span>
            <span className="col-span-2 flex items-center justify-center text-sm">
              {tradeInfo?.long.leverage}x
            </span>
            <span className="col-span-1 row-span-1 text-muted-foreground font-semibold flex items-center justify-center">
              Leverage
            </span>
            <span className="col-span-2 flex items-center justify-center text-sm">
              {tradeInfo?.short.leverage}x
            </span>
          </div>
        </div>
      )}

      {isBalanceLoading ? (
        <div className="flex-[0.8] grid grid-cols-7 grid-rows-3 gap-0 h-lg:gap-1.5 h-xl:gap-2 w-full border rounded-md p-1 h-lg:p-2 h-xl:p-3">
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

          <span className="text-xs text-muted-foreground capitalize">USDT</span>
          <span className="col-span-2">
            <Skeleton className="h-2.5 w-16 h-lg:h-3 h-lg:w-18 h-xl:h-4 h-xl:w-20" />
          </span>
          <span className="col-span-2">
            <Skeleton className="h-2.5 w-16 h-lg:h-3 h-lg:w-18 h-xl:h-4 h-xl:w-20" />
          </span>
          <span className="col-span-2">
            <Skeleton className="h-2.5 w-16 h-lg:h-3 h-lg:w-18 h-xl:h-4 h-xl:w-20" />
          </span>

          <span className="text-xs text-muted-foreground capitalize">
            TOTAL
          </span>
          <span className="col-span-2">
            <Skeleton className="h-2.5 w-16 h-lg:h-3 h-lg:w-18 h-xl:h-4 h-xl:w-20" />
          </span>
          <span className="col-span-2">
            <Skeleton className="h-2.5 w-16 h-lg:h-3 h-lg:w-18 h-xl:h-4 h-xl:w-20" />
          </span>
          <span className="col-span-2">
            <Skeleton className="h-2.5 w-16 h-lg:h-3 h-lg:w-18 h-xl:h-4 h-xl:w-20" />
          </span>
        </div>
      ) : balanceInfo ? (
        <div className="flex-[0.8] grid grid-cols-7 grid-rows-3 gap-0 h-lg:gap-1.5 h-xl:gap-2 w-full border rounded-md p-1 h-lg:p-2 h-xl:p-3 min-h-0">
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
          <span className="text-xs text-muted-foreground capitalize">
            {balanceInfo.base.name ?? 0}
          </span>
          {/* Exchange-specific balance data handling */}
          <BalanceDisplay 
            exchange={exchange}
            baseTotal={balanceInfo.base.total ?? 0}
            baseFree={balanceInfo.base.free ?? 0}
          />
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
        </div>
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
