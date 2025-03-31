import { useCCXT } from "@/contexts/ccxt/use";
import { useTrade } from "@/contexts/trade/use";
import { ExchangeType } from "@/lib/accounts";
import { cn, formatUSDValue, formatVolume } from "@/lib/utils";
import { Num } from "ccxt";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, BarChart4, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    timestamp?: number;
  }>({ price: data?.last, color: "default", timestamp: Date.now() });

  useEffect(() => {
    if (data && data.last) {
      const last = data.last;
      setCur((cur) => {
        if (!cur.price) {
          return { 
            price: last, 
            color: "default",
            percentage: data.percentage,
            timestamp: Date.now()
          };
        }
        if (cur.price > last) {
          return { 
            price: last, 
            color: "down", 
            percentage: data.percentage,
            timestamp: Date.now()
          };
        }
        if (cur.price < last) {
          return { 
            price: last, 
            color: "up",
            percentage: data.percentage,
            timestamp: Date.now()
          };
        }
        return { 
          ...cur, 
          percentage: data.percentage,
          timestamp: Date.now()
        };
      });
    }
  }, [data]);

  if (isLoading) {
    return (
      <Card className="w-full bg-card/30">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
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
                <span className="text-xs text-muted-foreground">고가:</span>
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex items-center justify-end gap-2">
                <span className="text-xs text-muted-foreground">저가:</span>
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
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

  // 마지막 업데이트 시간
  const lastUpdate = curPrice.timestamp 
    ? new Date(curPrice.timestamp).toLocaleTimeString()
    : "";

  return (
    <Card className="w-full bg-card/10 border">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h1 className={cn("text-2xl font-bold tracking-tighter", priceColor)}>
                {curPrice.price &&
                  ccxt?.[exchange]?.ccxt.priceToPrecision(
                    symbol,
                    Number(curPrice.price),
                  )}
              </h1>
              
              {percentageValue !== 0 && (
                <Badge variant="outline" className={cn(
                  "flex items-center gap-0.5 font-medium px-2 py-1 rounded-full",
                  percentageValue > 0 ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"
                )}>
                  {percentageIcon}
                  <span className={percentageColor}>
                    {percentageValue > 0 ? "+" : ""}{percentageValue.toFixed(2)}%
                  </span>
                </Badge>
              )}
            </div>
            
            <div className="flex flex-col space-y-1">
              <div className="flex gap-1 items-center text-sm">
                <BarChart4 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="capitalize text-muted-foreground">거래량:</span>
                <span className="font-medium">{formatVolume(Number(data?.quoteVolume))}</span>
              </div>
              
              <div className="flex gap-1 items-center text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>업데이트: {lastUpdate}</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-x-5 gap-y-1 bg-accent/10 p-2 rounded-md">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">고가 (24h)</span>
              <span className="text-sm font-semibold text-green-500">{formatUSDValue(Number(data?.high))}</span>
            </div>
            
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">저가 (24h)</span>
              <span className="text-sm font-semibold text-red-500">{formatUSDValue(Number(data?.low))}</span>
            </div>
            
            {exchange === "bybit" ? (
              <div className="flex flex-col col-span-2 mt-1">
                <span className="text-xs text-muted-foreground">총 거래대금</span>
                <span className="text-sm font-semibold">
                  {formatUSDValue(Number(data?.info.turnover24h))}
                </span>
              </div>
            ) : (
              <div className="flex flex-col col-span-2 mt-1">
                <span className="text-xs text-muted-foreground">VWAP (가중평균가)</span>
                <span className="text-sm font-semibold">
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
      </CardContent>
    </Card>
  );
};
