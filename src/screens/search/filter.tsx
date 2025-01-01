import { Input } from "@/components/ui/input";
import { Table } from "@tanstack/react-table";
import { TickerWithExchange } from "./columns";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Filter = ({ table }: { table: Table<TickerWithExchange> }) => {
  return (
    <div className="flex items-center py-4 justify-between w-full">
      <Input
        placeholder="Search Coins"
        value={(table.getColumn("symbol")?.getFilterValue() as string) ?? ""}
        onChange={(event) =>
          table.getColumn("symbol")?.setFilterValue(event.target.value)
        }
        className="max-w-sm"
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
        <SelectTrigger className="w-[120px]">
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
      {/* <DropdownMenu> */}
      {/*   <DropdownMenuTrigger asChild> */}
      {/*     <Button variant="outline"> */}
      {/*       Exchange <ChevronDown className="ml-2 h-4 w-4" /> */}
      {/*     </Button> */}
      {/*   </DropdownMenuTrigger> */}
      {/*   <DropdownMenuContent align="end"> */}
      {/*     <DropdownMenuCheckboxItem */}
      {/*       checked={!table.getColumn("exchange")?.getFilterValue()} */}
      {/*       onCheckedChange={() => */}
      {/*         table.getColumn("exchange")?.setFilterValue(null) */}
      {/*       } */}
      {/*     > */}
      {/*       All */}
      {/*     </DropdownMenuCheckboxItem> */}
      {/*     {["bybit", "binance", "bitget"].map((exchange) => ( */}
      {/*       <DropdownMenuCheckboxItem */}
      {/*         key={exchange} */}
      {/*         className="capitalize" */}
      {/*         checked={ */}
      {/*           table.getColumn("exchange")?.getFilterValue() === exchange */}
      {/*         } */}
      {/*         onCheckedChange={() => */}
      {/*           table.getColumn("exchange")?.setFilterValue(exchange) */}
      {/*         } */}
      {/*       > */}
      {/*         {exchange} */}
      {/*       </DropdownMenuCheckboxItem> */}
      {/*     ))} */}
      {/*   </DropdownMenuContent> */}
      {/* </DropdownMenu> */}
    </div>
  );
};
export default Filter;
