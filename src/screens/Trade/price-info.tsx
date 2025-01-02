import { cn } from "@/lib/utils";
import { Num, Ticker } from "ccxt";
import { useEffect, useState } from "react";

export const PriceInfo = ({ data }: { data: Ticker }) => {
  const { high, low, last, baseVolume, vwap } = data;
  const [curPrice, setCur] = useState<{
    price: Num;
    color: "default" | "up" | "down";
  }>({ price: last, color: "default" });

  useEffect(() => {
    if (last) {
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
  }, [last]);

  console.log(high, low, last, baseVolume, vwap);
  return (
    <div className="w-full flex justify-between items-center px-4">
      <div>
        <h1 className={cn("text-2xl")}>{curPrice.price}</h1>
      </div>
      <div></div>
    </div>
  );
};
