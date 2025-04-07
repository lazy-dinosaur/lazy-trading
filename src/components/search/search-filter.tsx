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
    <div className="flex items-center w-full gap-2 p-2 bg-background border-b"> {/* 패딩 및 배경/테두리 추가 */}
      <Input
        placeholder="검색 (예: 'btc usdt' 또는 '바이낸스 btc')" // 한글 플레이스홀더
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
          <SelectValue placeholder="거래소" /> {/* 한글 플레이스홀더 */}
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">전체</SelectItem> {/* 한글 옵션 */}
            <SelectItem value="bybit">바이빗</SelectItem> {/* 한글 옵션 */}
            <SelectItem value="binance">바이낸스</SelectItem> {/* 한글 옵션 */}
            <SelectItem value="bitget">비트겟</SelectItem> {/* 한글 옵션 */}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};
