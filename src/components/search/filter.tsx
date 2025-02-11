import { Input } from "@/components/ui/input";
import { Table } from "@tanstack/react-table";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TickerWithExchange } from "@/lib/ccxt";

const Filter = ({ table }: { table: Table<TickerWithExchange> }) => {
  return (
    <div className="flex items-center justify-between w-full gap-2">
      <Input
        placeholder="Search (e.g. 'btc usdt binance' or 'bybit btc/usdt')"
        value={(table.getColumn("symbol")?.getFilterValue() as string) ?? ""}
        onChange={(event) => {
          const value = event.target.value;
          table.getColumn("symbol")?.setFilterValue(value);
          
          // 거래소 키워드 확인
          const exchanges = ["bybit", "binance", "bitget"];
          const lowerValue = value.toLowerCase();
          const foundExchange = exchanges.find(ex => lowerValue.includes(ex));
          
          // 거래소 필터 설정
          table.getColumn("exchange")?.setFilterValue(foundExchange || null);
        }}
        className="max-full"
      />
      <Select
        defaultValue="all"
        onValueChange={(value) => {
          if (value == "all") {
            table.getColumn("exchange")?.setFilterValue(null);
          } else {
            table.getColumn("exchange")?.setFilterValue(value);
          }
        }}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Exchange" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="bybit">Bybit</SelectItem>
            <SelectItem value="binance">Binance</SelectItem>
            <SelectItem value="bitget">Bitget</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};
export default Filter;
