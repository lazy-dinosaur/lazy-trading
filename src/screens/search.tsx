import { useEffect, useState, useMemo } from "react"; // useMemo 추가
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
    const favorites = localStorage.getItem("coin_favorites");
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    console.error("Failed to load favorites:", error);
    return [];
  }
};

// 거래소 이름 한글 매핑 (검색용)
const exchangeNameMap: Record<string, string> = {
  bybit: "바이빗",
  binance: "바이낸스",
  bitget: "비트겟",
};
const reverseExchangeNameMap: Record<string, string> = Object.fromEntries(
  Object.entries(exchangeNameMap).map(([key, value]) => [value, key]),
);

const Search = () => {
  const { data: tickersData, isLoading } = useAllTickers();
  const [formattedTickers, setFormattedTickers] = useState<
    TickerWithExchange[]
  >([]);
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

  // 필터링 및 정렬 로직 (useMemo로 최적화)
  const filteredAndSortedTickers = useMemo(() => {
    return formattedTickers
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
          const terms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean); // 공백 제거

          // 거래소 키워드 (영문/한글) 확인 및 제외
          const exchangeKeywords = [
            ...Object.keys(exchangeNameMap),
            ...Object.values(exchangeNameMap),
          ];
          const searchTerms = terms.filter(
            (term) => !exchangeKeywords.includes(term),
          );
          const exchangeTerm = terms.find((term) =>
            exchangeKeywords.includes(term),
          );

          // 검색어에 거래소 키워드가 있고, 현재 거래소 필터와 다른 경우 필터링
          if (exchangeTerm) {
            const targetExchange =
              reverseExchangeNameMap[exchangeTerm] || exchangeTerm;
            if (ticker.exchange !== targetExchange) {
              return false;
            }
          }

          // 심볼 검색 (남은 검색어로)
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
          const symbolA = String(a[key])
            .toLowerCase()
            .replace(/^[0-9]+/, ""); // 숫자 제거 후 비교
          const symbolB = String(b[key])
            .toLowerCase()
            .replace(/^[0-9]+/, ""); // 숫자 제거 후 비교
          return direction === "asc"
            ? symbolA.localeCompare(symbolB)
            : symbolB.localeCompare(symbolA);
        }

        // 숫자 타입의 필드인 경우
        const valueA = a[key] || 0;
        const valueB = b[key] || 0;
        return direction === "asc" ? valueA - valueB : valueB - valueA;
      });
  }, [
    formattedTickers,
    showFavorites,
    favorites,
    exchangeFilter,
    searchQuery,
    sortConfig,
  ]);

  const handleFavoriteFilter = (showFavs: boolean) => {
    setShowFavorites(showFavs);
  };

  // 즐겨찾기 토글 함수 (CoinGrid에 전달하기 위함)
  const toggleFavorite = (ticker: TickerWithExchange) => {
    const tickerKey = `${ticker.exchange}-${ticker.symbol}`;
    const newFavorites = favorites.includes(tickerKey)
      ? favorites.filter((key) => key !== tickerKey)
      : [...favorites, tickerKey];

    setFavorites(newFavorites);
    // 로컬 스토리지 업데이트는 비동기로 처리하여 UI 반응성 유지
    setTimeout(() => {
      try {
        localStorage.setItem("coin_favorites", JSON.stringify(newFavorites));
      } catch (error) {
        console.error("Failed to save favorites:", error);
      }
    }, 0);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    // 검색어에서 거래소 키워드(한글 포함) 확인 및 필터 자동 설정
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const exchangeKeywords = [
      ...Object.keys(exchangeNameMap),
      ...Object.values(exchangeNameMap),
    ];
    const foundKeyword = terms.find((term) => exchangeKeywords.includes(term));

    if (foundKeyword) {
      const targetExchange =
        reverseExchangeNameMap[foundKeyword] || foundKeyword;
      // 현재 필터와 다를 경우에만 업데이트
      if (exchangeFilter !== targetExchange) {
        setExchangeFilter(targetExchange);
      }
    } else {
      // 검색어에 거래소 키워드가 없으면 거래소 필터 해제 (선택 사항)
      // setExchangeFilter(null);
    }
  };

  const handleExchangeFilter = (exchange: string | null) => {
    setExchangeFilter(exchange);
  };

  const handleSort = (key: "baseVolume" | "last" | "symbol") => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "desc"
          ? "asc"
          : "desc",
    }));
  };

  return (
    <ScreenWrapper headerProps={{ title: "검색" }}>
      {/* title 직접 전달 */}
      {/* 컨텐츠 영역을 div로 감싸고 하단 패딩 추가 */}
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
