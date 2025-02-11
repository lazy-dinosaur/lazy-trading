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

const grepFilter: FilterFn<TickerWithExchange> = (row, columnId, value) => {
  if (!value) return true;
  const searchStr = String(value).toLowerCase().trim();
  const terms = searchStr.split(/\s+/);
  
  // 거래소 키워드 제외
  const exchanges = ["bybit", "binance", "bitget"];
  const searchTerms = terms.filter(term => !exchanges.includes(term));
  
  // 심볼 검색어 처리
  const cellValue = String(row.getValue(columnId)).toLowerCase();
  return searchTerms.every(term => {
    // '/' 문자를 포함하는 경우와 아닌 경우 모두 처리
    const searchParts = term.split('/');
    if (searchParts.length > 1) {
      return searchParts.every(part => cellValue.includes(part));
    }
    return cellValue.includes(term);
  });
};

export const columns: ColumnDef<TickerWithExchange>[] = [
  {
    accessorKey: "exchange",
    header: () => "",
    cell: ({ row }) => {
      const exchange = row.getValue("exchange");
      if (exchange == "bybit") {
        return (
          <Avatar className="h-6 w-6">
            <AvatarImage
              src="https://s2.coinmarketcap.com/static/img/exchanges/64x64/521.png"
              alt="@shadcn"
            />
            <AvatarFallback>Bybit</AvatarFallback>
          </Avatar>
        );
      } else if (exchange == "binance") {
        return (
          <Avatar className="h-6 w-6">
            <AvatarImage
              src="https://s2.coinmarketcap.com/static/img/exchanges/64x64/270.png"
              alt="@shadcn"
            />
            <AvatarFallback>Binance</AvatarFallback>
          </Avatar>
        );
      } else {
        return (
          <Avatar className="h-6 w-6">
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
    size: 40,
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
    filterFn: grepFilter,
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
