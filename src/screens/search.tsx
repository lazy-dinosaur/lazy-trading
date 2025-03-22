import { useEffect, useState } from "react";
import { ScreenWrapper } from "@/components/screen-wrapper";
import { useAllTickers } from "@/hooks/coin";
import { TickerWithExchange } from "@/lib/ccxt";
import { useCCXT } from "@/contexts/ccxt/use";
import { SearchFilter } from "@/components/search/search-filter";
import { CoinGrid } from "@/components/search/coin-grid";
import { SkeletonGrid } from "@/components/search/skeleton-grid";
import { SortControls } from "@/components/search/sort-controls";
import { SkeletonSortControls } from "@/components/search/skeleton-sort-controls";

// 즐겨찾기 목록 저장/불러오기 함수
const getFavorites = (): string[] => {
  try {
    const favorites = localStorage.getItem('coin_favorites');
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    console.error('Failed to load favorites:', error);
    return [];
  }
};

const Search = () => {
  const { data: tickersData, isLoading } = useAllTickers();
  const [formattedTickers, setFormattedTickers] = useState<TickerWithExchange[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [exchangeFilter, setExchangeFilter] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(getFavorites);
  const [sortConfig, setSortConfig] = useState<{
    key: "baseVolume" | "last" | "symbol";
    direction: "asc" | "desc";
  }>({
    key: "baseVolume",
    direction: "desc",
  });
  const ccxt = useCCXT();

  useEffect(() => {
    if (!tickersData || isLoading || !ccxt) return;

    const formatted = tickersData.map((ticker) => ({
      ...ticker,
      baseVolume: ticker.baseVolume! * ticker.last!,
      last: ccxt[ticker.exchange].ccxt.priceToPrecision(
        ticker.symbol,
        ticker.last,
      ),
    }));

    setFormattedTickers(formatted as any);
  }, [tickersData, isLoading, ccxt]);

  // 필터링 및 정렬 로직
  const filteredAndSortedTickers = formattedTickers
    .filter((ticker) => {
      // 즐겨찾기 필터
      if (showFavorites) {
        const tickerKey = `${ticker.exchange}-${ticker.symbol}`;
        if (!favorites.includes(tickerKey)) {
          return false;
        }
      }

      // 거래소 필터
      if (exchangeFilter && ticker.exchange !== exchangeFilter) {
        return false;
      }

      // 검색어 필터
      if (searchQuery) {
        const terms = searchQuery.toLowerCase().split(/\s+/);
        
        // 거래소 키워드 제외
        const exchanges = ["bybit", "binance", "bitget"];
        const searchTerms = terms.filter((term) => !exchanges.includes(term));
        
        // 심볼 검색
        const symbol = String(ticker.symbol).toLowerCase();
        return searchTerms.every((term) => {
          const searchParts = term.split("/");
          if (searchParts.length > 1) {
            return searchParts.every((part) => symbol.includes(part));
          }
          return symbol.includes(term);
        });
      }
      
      return true;
    })
    .sort((a, b) => {
      const { key, direction } = sortConfig;
      
      if (key === "symbol") {
        const symbolA = String(a[key]).toLowerCase();
        const symbolB = String(b[key]).toLowerCase();
        return direction === "asc" 
          ? symbolA.localeCompare(symbolB) 
          : symbolB.localeCompare(symbolA);
      }
      
      // 숫자 타입의 필드인 경우
      const valueA = a[key] || 0;
      const valueB = b[key] || 0;
      return direction === "asc" ? valueA - valueB : valueB - valueA;
    });

  const handleFavoriteFilter = (showFavs: boolean) => {
    setShowFavorites(showFavs);
  };

  // 즐겨찾기 토글 함수 (CoinGrid에 전달하기 위함)
  const toggleFavorite = (ticker: TickerWithExchange) => {
    const tickerKey = `${ticker.exchange}-${ticker.symbol}`;
    const newFavorites = favorites.includes(tickerKey)
      ? favorites.filter(key => key !== tickerKey)
      : [...favorites, tickerKey];
    
    setFavorites(newFavorites);
    localStorage.setItem('coin_favorites', JSON.stringify(newFavorites));
  };
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    // 거래소 키워드 확인 및 필터 설정
    const exchanges = ["bybit", "binance", "bitget"];
    const lowerValue = query.toLowerCase();
    const foundExchange = exchanges.find(ex => lowerValue.includes(ex));
    
    if (foundExchange) {
      setExchangeFilter(foundExchange);
    }
  };

  const handleExchangeFilter = (exchange: string | null) => {
    setExchangeFilter(exchange);
  };

  const handleSort = (key: "baseVolume" | "last" | "symbol") => {
    setSortConfig(prevConfig => ({
      key,
      direction: 
        prevConfig.key === key && prevConfig.direction === "desc" ? "asc" : "desc"
    }));
  };

  return (
    <ScreenWrapper headerProps={{ title: "Search" }}>
      <SearchFilter 
        onSearch={handleSearch} 
        onExchangeFilter={handleExchangeFilter}
        searchQuery={searchQuery}
        exchangeFilter={exchangeFilter}
      />
      {isLoading ? (
        <>
          <SkeletonSortControls />
          <SkeletonGrid />
        </>
      ) : (
        <>
          <SortControls
            sortConfig={sortConfig}
            onSort={handleSort}
            showFavorites={showFavorites}
            onFavoriteFilter={handleFavoriteFilter}
          />
          <CoinGrid 
            tickers={filteredAndSortedTickers}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
          />
        </>
      )}
    </ScreenWrapper>
  );
};

export default Search;
