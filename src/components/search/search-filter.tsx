import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  
  return (
    <div className="flex items-center w-full gap-2 p-2 bg-background border-b">
      <Input
        placeholder={t('search.search_example')}
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
          <SelectValue placeholder={t('search.exchange')} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">{t('search.all')}</SelectItem>
            <SelectItem value="bybit">{t('search.bybit')}</SelectItem>
            <SelectItem value="binance">{t('search.binance')}</SelectItem>
            <SelectItem value="bitget">{t('search.bitget')}</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};
