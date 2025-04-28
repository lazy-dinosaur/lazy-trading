import { ArrowUpDown, ArrowDown, ArrowUp } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";

interface SortControlsProps {
  sortConfig: {
    key: "baseVolume" | "last" | "symbol";
    direction: "asc" | "desc";
  };
  onSort: (key: "baseVolume" | "last" | "symbol") => void;
  showFavorites: boolean;
  onFavoriteFilter: (showFavorites: boolean) => void;
}

export const SortControls = ({
  sortConfig,
  onSort,
  showFavorites,
  onFavoriteFilter
}: SortControlsProps) => {
  const { t } = useTranslation();
  
  // 정렬 버튼 컴포넌트
  const SortButton = ({
    labelKey,
    sortKey
  }: {
    labelKey: string;
    sortKey: "baseVolume" | "last" | "symbol";
  }) => (
    <button
      onClick={() => onSort(sortKey)}
      className="flex items-center justify-center text-xs h-lg:text-sm"
    >
      {t(labelKey)}
      {sortConfig.key === sortKey ? (
        sortConfig.direction === "asc" ? (
          <ArrowUp className="ml-1 w-3 h-3 h-lg:w-4 h-lg:h-4" />
        ) : (
          <ArrowDown className="ml-1 w-3 h-3 h-lg:w-4 h-lg:h-4" />
        )
      ) : (
        <ArrowUpDown className="ml-1 w-3 h-3 h-lg:w-4 h-lg:h-4" />
      )}
    </button>
  );

  return (
    <div className="flex justify-between items-center space-x-4 p-2 bg-background border-b">
      <Tabs
        defaultValue={showFavorites ? "favorites" : "all"}
        className="h-6 h-lg:h-8 h-xl:h-10"
        onValueChange={(value) => onFavoriteFilter(value === "favorites")}
      >
        <TabsList>
          <TabsTrigger value="all">{t('search.all')}</TabsTrigger>
          <TabsTrigger value="favorites">{t('search.favorites')}</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex space-x-4">
        <SortButton labelKey="search.symbol" sortKey="symbol" />
        <SortButton labelKey="search.volume" sortKey="baseVolume" />
        <SortButton labelKey="search.price" sortKey="last" />
      </div>
    </div>
  );
};
