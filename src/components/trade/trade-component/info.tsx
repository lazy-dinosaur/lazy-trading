import { useTrade } from "@/contexts/trade/use";
import { ExchangeType } from "@/lib/accounts";
import { Link, useSearchParams } from "react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { TEXT_SIZE } from "@/lib/constants";

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
    <div className="h-full w-full flex flex-col gap-2 overflow-hidden p-2">
      {/* 상단 헤더 영역 */}
      <div className="flex w-full items-center justify-between bg-muted/20 p-2 rounded-md">
        <span className="text-sm font-medium">
          Trading Information
        </span>
        <div className="flex gap-3 text-xs">
          {isTradeInfoLoading ? (
            <>
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
            </>
          ) : (
            <>
              <div className="flex flex-col items-center">
                <span className="text-muted-foreground">Maker Fee</span>
                <span className="font-semibold">{tradeInfo?.tradingfee?.maker}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-muted-foreground">Taker Fee</span>
                <span className="font-semibold">{tradeInfo?.tradingfee?.taker}</span>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* 트레이딩 정보 영역 */}
      {isTradeInfoLoading ? (
        <div className="flex-1 w-full bg-accent/10 rounded-md p-3 border">
          <div className="flex justify-between mb-3">
            <div className="px-4 py-1 rounded-md bg-accent/20 text-center">
              <span className="font-semibold">LONG</span>
            </div>
            <div className="px-4 py-1 rounded-md bg-accent/20 text-center">
              <span className="font-semibold">SHORT</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="text-muted-foreground text-center">Stop Loss</div>
              <div className="text-center">
                <Skeleton className="h-4 w-full mx-auto" />
              </div>
              <div className="text-center">
                <Skeleton className="h-4 w-full mx-auto" />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="text-muted-foreground text-center">Take Profit</div>
              <div className="text-center">
                <Skeleton className="h-4 w-full mx-auto" />
              </div>
              <div className="text-center">
                <Skeleton className="h-4 w-full mx-auto" />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="text-muted-foreground text-center">Leverage</div>
              <div className="text-center">
                <Skeleton className="h-4 w-12 mx-auto" />
              </div>
              <div className="text-center">
                <Skeleton className="h-4 w-12 mx-auto" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 w-full bg-accent/10 rounded-md p-3 border">
          <div className="flex justify-between mb-3">
            <div className="px-4 py-1 rounded-md bg-green-500/10 text-green-500 text-center">
              <span className="font-semibold">LONG</span>
            </div>
            <div className="px-4 py-1 rounded-md bg-red-500/10 text-red-500 text-center">
              <span className="font-semibold">SHORT</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="text-muted-foreground text-center">Stop Loss</div>
              <div className="text-center p-1 rounded-md bg-green-500/5">
                <div>{tradeInfo?.long.stoploss.formatted}</div>
                <div className="text-xs text-muted-foreground">({tradeInfo?.long.stoploss.percentage}%)</div>
              </div>
              <div className="text-center p-1 rounded-md bg-red-500/5">
                <div>{tradeInfo?.short.stoploss.formatted}</div>
                <div className="text-xs text-muted-foreground">({tradeInfo?.short.stoploss.percentage}%)</div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="text-muted-foreground text-center">Take Profit</div>
              <div className="text-center p-1 rounded-md bg-green-500/5">
                <div>{tradeInfo?.long.target.formatted}</div>
                <div className="text-xs text-muted-foreground">({tradeInfo?.long.target.percentage}%)</div>
              </div>
              <div className="text-center p-1 rounded-md bg-red-500/5">
                <div>{tradeInfo?.short.target.formatted}</div>
                <div className="text-xs text-muted-foreground">({tradeInfo?.short.target.percentage}%)</div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="text-muted-foreground text-center">Leverage</div>
              <div className="text-center font-semibold">{tradeInfo?.long.leverage}x</div>
              <div className="text-center font-semibold">{tradeInfo?.short.leverage}x</div>
            </div>
          </div>
        </div>
      )}

      {/* 잔고 정보 */}
      {isBalanceLoading ? (
        <div className="w-full border rounded-md p-2 bg-muted/10">
          <div className="text-sm font-medium mb-2">Balance Information</div>
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-2">
              <div className="text-xs text-muted-foreground">Asset</div>
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="text-xs text-muted-foreground">Free</div>
              <div className="text-xs text-muted-foreground">Used</div>
            </div>
            
            <div className="grid grid-cols-4 gap-2 items-center">
              <div className="text-xs font-medium">USDT</div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
            </div>
            
            <div className="grid grid-cols-4 gap-2 items-center border-t pt-1">
              <div className="text-xs font-medium">TOTAL</div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        </div>
      ) : balanceInfo ? (
        <div className="w-full border rounded-md p-2 bg-muted/10">
          <div className="text-sm font-medium mb-2">Balance Information</div>
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-2">
              <div className="text-xs text-muted-foreground">Asset</div>
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="text-xs text-muted-foreground">Free</div>
              <div className="text-xs text-muted-foreground">Used</div>
            </div>
            
            <div className="grid grid-cols-4 gap-2 items-center">
              <div className="text-xs font-medium">{balanceInfo.base.name ?? 'USDT'}</div>
              <div className="text-xs">{balanceInfo.base.total ?? 0}</div>
              <div className="text-xs">{balanceInfo.base.free ?? 0}</div>
              <div className="text-xs">{balanceInfo.base.used ?? 0}</div>
            </div>
            
            <div className="grid grid-cols-4 gap-2 items-center border-t pt-1">
              <div className="text-xs font-medium">TOTAL USD</div>
              <div className="text-xs font-semibold">{balanceInfo.usd.total}</div>
              <div className="text-xs">{balanceInfo.usd.free}</div>
              <div className="text-xs">{balanceInfo.usd.used}</div>
            </div>
          </div>
        </div>
      ) : (
        <Link
          to={`/account/add?exchange=${exchange}`}
          className="w-full border rounded-md p-3 bg-accent/10 font-medium text-center flex flex-col gap-1 hover:bg-accent/20 transition-colors"
        >
          <span>{`No API Key Detected for ${exchange}`}</span>
          <span className="text-sm text-primary">Click here to add API Key</span>
        </Link>
      )}
    </div>
  );
};
