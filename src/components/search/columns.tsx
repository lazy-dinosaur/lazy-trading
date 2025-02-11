import { ColumnDef, FilterFn } from "@tanstack/react-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TickerWithExchange } from "@/lib/ccxt";
import { formatVolume } from "@/lib/utils";
import { ArrowUpDown, ArrowDown, ArrowUp } from "lucide-react";

// 필터 함수 정의
const exchangeFilter: FilterFn<TickerWithExchange> = (row, columnId, value) => {
  if (!value) return true; // value가 없으면 모든 행 표시
  return row.getValue(columnId) === value;
};

export const columns: ColumnDef<TickerWithExchange>[] = [
  {
    accessorKey: "exchange",
    header: () => "",
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
    size: 30,
  },
  {
    accessorKey: "symbol",
    header: ({ column }) => {
      return (
        <button
          onClick={() => column.toggleSorting()}
          className="flex items-center"
        >
          Symbol
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </button>
      );
    },
    cell: ({ row }) => {
      const symbol = row.getValue("symbol") as string;
      // 콜론으로 분리 후 첫 번째 부분 선택
      const baseSymbol = symbol.split(":")[0];
      // 숫자로 시작하는 부분을 제거하고 실제 심볼만 추출
      return baseSymbol.replace(/^[0-9]+/, "");
    },
    size: 200,
  },
  {
    accessorKey: "baseVolume",
    header: ({ column }) => {
      return (
        <button
          onClick={() => column.toggleSorting()}
          className="flex items-center"
        >
          Volume
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </button>
      );
    },
    cell: ({ row }) => {
      const volume = row.getValue("baseVolume") as number;
      return formatVolume(volume);
    },
    size: 150,
    sortDescFirst: true,
  },
  {
    accessorKey: "last",
    header: ({ column }) => {
      return (
        <button
          onClick={() => column.toggleSorting()}
          className="flex items-center"
        >
          Price
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </button>
      );
    },
    size: 100,
    sortDescFirst: true,
  },
];
