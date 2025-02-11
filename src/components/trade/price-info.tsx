import { useCCXT } from "@/contexts/ccxt/use";
import { useTrade } from "@/contexts/trade/use";
import { ExchangeType } from "@/lib/accounts";
import { cn, formatUSDValue, formatVolume } from "@/lib/utils";
import { Num } from "ccxt";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { Skeleton } from "@/components/ui/skeleton";

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
  }>({ price: data?.last, color: "default" });

  useEffect(() => {
    if (data && data.last) {
      const last = data.last;
      setCur((cur) => {
        if (!cur.price) {
          return { price: last, color: "default" };
        }
        if (cur.price > last) {
          return { price: last, color: "up" };
        }
        if (cur.price < last) {
          return { price: last, color: "down" };
        }
        return cur;
      });
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="w-full flex justify-between items-center">
        <div>
          <div className="text-3xl mb-2">
            <Skeleton className="h-8 w-40" />
          </div>
          <div className="flex gap-1 text-sm">
            <span className="capitalize text-muted-foreground">volume</span>
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <div className="text-sm">
          <div className="flex w-full items-center justify-between gap-2">
            <span className="capitalize text-muted-foreground">24High</span>
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex w-full items-center justify-between gap-2">
            <span className="capitalize text-muted-foreground">24Low</span>
            <Skeleton className="h-4 w-24" />
          </div>
          {exchange == "bybit" ? (
            <div className="flex w-full items-center justify-between gap-2">
              <span className="capitalize text-muted-foreground">24Turnover</span>
              <Skeleton className="h-4 w-24" />
            </div>
          ) : (
            <div className="flex w-full items-center justify-between gap-2">
              <span className="capitalize text-muted-foreground">vwap</span>
              <Skeleton className="h-4 w-24" />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-between items-center">
      <div className="">
        <h1
          className={cn(
            "text-3xl",
            curPrice.color == "up" ? "text-green-600" : "text-red-600",
          )}
        >
          {curPrice.price &&
            ccxt?.[exchange]?.ccxt.priceToPrecision(
              symbol,
              Number(curPrice.price),
            )}
        </h1>
        <span className="flex gap-1 text-sm">
          <span className="capitalize text-muted-foreground">volume</span>
          <span>{formatVolume(Number(data?.quoteVolume))}</span>
        </span>
      </div>
      <div className="text-sm">
        <div className="flex w-full items-center justify-between gap-2">
          <span className="capitalize text-muted-foreground">24High</span>
          <span>{formatUSDValue(Number(data?.high))}</span>
        </div>
        <div className="flex w-full items-center justify-between gap-2">
          <span className="capitalize text-muted-foreground">24Low</span>
          <span>{formatUSDValue(Number(data?.low))}</span>
        </div>
        {exchange == "bybit" ? (
          <div className="flex w-full items-center justify-between gap-2">
            <span className="capitalize text-muted-foreground">24Turnover</span>
            <span>{formatUSDValue(Number(data?.info.turnover24h))}</span>
          </div>
        ) : (
          <div className="flex w-full items-center justify-between gap-2">
            <span className="capitalize text-muted-foreground">vwap</span>
            <span>
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
