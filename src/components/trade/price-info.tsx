import { useCCXT } from "@/contexts/ccxt/use";
import { useTrade } from "@/contexts/trade/use";
import { ExchangeType } from "@/lib/accounts";
import { cn, formatUSDValue, formatVolume } from "@/lib/utils";
import { Num } from "ccxt";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, BarChart4 } from "lucide-react";

export const PriceInfo = () => {
  const [searchParams] = useSearchParams();
  const exchange = searchParams.get("exchange") as ExchangeType;
  const symbol = searchParams.get("symbol")!;

  const ccxt = useCCXT();

  const {
    tickerQuery: { data, isLoading },
  } = useTrade();

  const [curPrice, setCur] = useState<{
    price: Num;
    color: "default" | "up" | "down";
    percentage?: number;
  }>({ price: data?.last, color: "default" });

  useEffect(() => {
    if (data && data.last) {
      const last = data.last;
      setCur((cur) => {
        if (!cur.price) {
          return { 
            price: last, 
            color: "default",
            percentage: data.percentage 
          };
        }
        if (cur.price > last) {
          return { 
            price: last, 
            color: "down", 
            percentage: data.percentage
          };
        }
        if (cur.price < last) {
          return { 
            price: last, 
            color: "up",
            percentage: data.percentage 
          };
        }
        return { 
          ...cur, 
          percentage: data.percentage 
        };
      });
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="w-full flex justify-between items-center bg-card/30 p-3 rounded-md border">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-32" />
          </div>
          <div className="flex gap-2 items-center">
            <Skeleton className="h-4 w-5" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs text-muted-foreground">24H High:</span>
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs text-muted-foreground">24H Low:</span>
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs text-muted-foreground">
              {exchange === "bybit" ? "Turnover:" : "VWAP:"}
            </span>
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
    );
  }

  // 가격 변화 방향에 따라 스타일 지정
  const priceColor = curPrice.color === "up" 
    ? "text-green-500" 
    : curPrice.color === "down" 
      ? "text-red-500" 
      : "text-foreground";
      
  const percentageValue = curPrice.percentage ? Number(curPrice.percentage) : 0;
  const percentageColor = percentageValue > 0 
    ? "text-green-500" 
    : percentageValue < 0 
      ? "text-red-500" 
      : "text-muted-foreground";
  
  const percentageIcon = percentageValue > 0 
    ? <TrendingUp className="h-4 w-4 text-green-500" /> 
    : percentageValue < 0 
      ? <TrendingDown className="h-4 w-4 text-red-500" />
      : null;

  return (
    <div className="w-full flex justify-between items-start bg-card/30 p-3 rounded-md border">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className={cn("text-2xl font-bold", priceColor)}>
            {curPrice.price &&
              ccxt?.[exchange]?.ccxt.priceToPrecision(
                symbol,
                Number(curPrice.price),
              )}
          </h1>
          
          {percentageValue !== 0 && (
            <div className={cn(
              "flex items-center gap-0.5 text-sm font-medium px-1.5 py-0.5 rounded",
              percentageValue > 0 ? "bg-green-500/10" : "bg-red-500/10"
            )}>
              {percentageIcon}
              <span className={percentageColor}>
                {percentageValue > 0 ? "+" : ""}{percentageValue.toFixed(2)}%
              </span>
            </div>
          )}
        </div>
        
        <div className="flex gap-1 items-center text-sm">
          <BarChart4 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="capitalize text-muted-foreground">Vol:</span>
          <span className="font-medium">{formatVolume(Number(data?.quoteVolume))}</span>
        </div>
      </div>
      
      <div className="space-y-1">
        <div className="flex items-center justify-end gap-2">
          <span className="text-xs text-muted-foreground">24H High:</span>
          <span className="text-xs font-semibold">{formatUSDValue(Number(data?.high))}</span>
        </div>
        <div className="flex items-center justify-end gap-2">
          <span className="text-xs text-muted-foreground">24H Low:</span>
          <span className="text-xs font-semibold">{formatUSDValue(Number(data?.low))}</span>
        </div>
        {exchange === "bybit" ? (
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs text-muted-foreground">Turnover:</span>
            <span className="text-xs font-semibold">
              {formatUSDValue(Number(data?.info.turnover24h))}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs text-muted-foreground">VWAP:</span>
            <span className="text-xs font-semibold">
              {data?.vwap &&
                ccxt?.[exchange]?.ccxt.priceToPrecision(
                  symbol,
                  Number(data.vwap),
                )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
