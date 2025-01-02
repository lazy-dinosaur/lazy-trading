import { ExchangeType } from "@/hooks/useAccounts";
import { ColumnDef, FilterFn } from "@tanstack/react-table";
import { Ticker } from "ccxt";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// 필터 함수 정의
const exchangeFilter: FilterFn<TickerWithExchange> = (row, columnId, value) => {
  if (!value) return true; // value가 없으면 모든 행 표시
  return row.getValue(columnId) === value;
};

export type TickerWithExchange = Ticker & { exchange: ExchangeType };
export const columns: ColumnDef<TickerWithExchange>[] = [
  {
    accessorKey: "exchange",
    header: "",
    cell: ({ row }) => {
      const exchange = row.getValue("exchange");
      if (exchange == "bybit") {
        return (
          <Avatar className="w-5 h-5">
            <AvatarImage
              src="https://s2.coinmarketcap.com/static/img/exchanges/64x64/521.png"
              alt="@shadcn"
            />
            <AvatarFallback>Bybit</AvatarFallback>
          </Avatar>
        );
      } else if (exchange == "binance") {
        return (
          <Avatar className="w-5 h-5">
            <AvatarImage
              src="https://s2.coinmarketcap.com/static/img/exchanges/64x64/270.png"
              alt="@shadcn"
            />
            <AvatarFallback>Binance</AvatarFallback>
          </Avatar>
        );
      } else {
        return (
          <Avatar className="w-5 h-5">
            <AvatarImage
              src="https://s2.coinmarketcap.com/static/img/exchanges/64x64/513.png"
              alt="@shadcn"
            />
            <AvatarFallback>Bitget</AvatarFallback>
          </Avatar>
        );
      }
    },
    filterFn: exchangeFilter,
    enableColumnFilter: true,
  },
  {
    accessorKey: "symbol",
    header: "Symbol",
    cell: ({ row }) => {
      const symbol = row.getValue("symbol") as string;
      return symbol.split(":")[0];
    },
  },
  {
    accessorKey: "baseVolume",
    header: "Volume",
  },
  {
    accessorKey: "markPrice",
    accessorFn: (ticker) => {
      if (ticker.exchange == "binance") {
        return ticker.info.lastPrice;
      } else {
        return ticker.markPrice;
      }
    },
    header: "Price",
  },
];
