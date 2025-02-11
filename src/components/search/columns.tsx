import { ColumnDef, FilterFn } from "@tanstack/react-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TickerWithExchange } from "@/lib/ccxt";
import { formatUSDValue, formatVolume } from "@/lib/utils";

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
    header: () => "Symbol",
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
    header: () => "Volume",
    cell: ({ row }) => {
      const volume = row.getValue("baseVolume") as number;
      return formatVolume(volume);
    },
    size: 150,
  },
  {
    accessorKey: "markPrice",
    accessorFn: (ticker) => {
      if (ticker.exchange == "binance") {
        return Number(ticker.info.lastPrice);
      } else {
        return Number(ticker.markPrice);
      }
    },
    header: () => "Price",
    cell: ({ row }) => {
      const price = row.getValue("markPrice") as number;
      return formatUSDValue(price);
    },
    size: 100,
  },
];
