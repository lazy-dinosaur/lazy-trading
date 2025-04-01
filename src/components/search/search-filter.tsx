import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SearchFilterProps {
  onSearch: (query: string) => void;
  onExchangeFilter: (exchange: string | null) => void;
  searchQuery: string;
  exchangeFilter: string | null;
}

export const SearchFilter = ({
  onSearch,
  onExchangeFilter,
  searchQuery,
  exchangeFilter,
}: SearchFilterProps) => {
  return (
    <div className="flex items-center w-full gap-2">
      <Input
        placeholder="Search (e.g. 'btc usdt binance' or 'bybit btc/usdt')"
        value={searchQuery}
        onChange={(event) => onSearch(event.target.value)}
        className="max-full h-6 h-lg:h-8 h-xl:h-10 flex-1"
      />
      <Select
        value={exchangeFilter || "all"}
        onValueChange={(value) => {
          onExchangeFilter(value === "all" ? null : value);
        }}
      >
        <SelectTrigger className="w-40 h-6 h-lg:h-8 h-xl:h-10">
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
