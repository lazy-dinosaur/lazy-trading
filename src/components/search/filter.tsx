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
        placeholder="Search Coins"
        value={(table.getColumn("symbol")?.getFilterValue() as string) ?? ""}
        onChange={(event) =>
          table.getColumn("symbol")?.setFilterValue(event.target.value)
        }
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
