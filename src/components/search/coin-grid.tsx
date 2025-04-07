import { TickerWithExchange } from "@/lib/ccxt";
import { formatVolume } from "@/lib/utils";
import { useNavigate } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Star } from "lucide-react";

// 거래소 아이콘 정보
const exchangeIcons: Record<string, { src: string; fallback: string }> = {
  bybit: {
    src: "https://s2.coinmarketcap.com/static/img/exchanges/64x64/521.png",
    fallback: "By", // 짧은 대체 텍스트
  },
  binance: {
    src: "https://s2.coinmarketcap.com/static/img/exchanges/64x64/270.png",
    fallback: "Bi", // 짧은 대체 텍스트
  },
  bitget: {
    src: "https://s2.coinmarketcap.com/static/img/exchanges/64x64/513.png",
    fallback: "Bg", // 짧은 대체 텍스트
  },
};

// 거래소 이름 한글 매핑
const exchangeNames: Record<string, string> = {
  bybit: "바이빗",
  binance: "바이낸스",
  bitget: "비트겟",
};

interface CoinGridProps {
  tickers: TickerWithExchange[];
  favorites?: string[];
  onToggleFavorite?: (ticker: TickerWithExchange) => void;
}

export const CoinGrid = ({
  tickers,
  favorites = [],
  onToggleFavorite,
}: CoinGridProps) => {
  const navigate = useNavigate();
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(3);
  const [cardHeight, setCardHeight] = useState(140);

  // 반응형 그리드 설정
  useEffect(() => {
    const updateLayout = () => {
      // 컬럼 수 업데이트
      if (window.innerWidth < 400) {
        setColumnCount(1);
      } else if (window.innerWidth < 1024) {
        setColumnCount(2);
      } else {
        setColumnCount(3);
      }

      // 카드 높이 업데이트
      if (window.innerHeight < 800) {
        setCardHeight(120);
      } else if (window.innerHeight < 1000) {
        setCardHeight(130);
      } else {
        setCardHeight(140);
      }
    };

    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, []);

  // 심볼 형식화 함수
  const formatSymbol = useCallback((symbol: string) => {
    const baseSymbol = symbol.split(":")[0];
    return baseSymbol.replace(/^[0-9]+/, "");
  }, []);

  // 그리드 항목 행 계산 - useMemo 사용하여 최적화
  const gridItems = useMemo(() => {
    const items: TickerWithExchange[][] = [];
    for (let i = 0; i < tickers.length; i += columnCount) {
      const rowItems = tickers.slice(i, i + columnCount);
      items.push(rowItems);
    }
    return items;
  }, [tickers, columnCount]);

  // 가상화 스크롤링 설정
  const rowVirtualizer = useVirtualizer({
    count: gridItems.length,
    getScrollElement: () => gridContainerRef.current,
    estimateSize: () => cardHeight,
    overscan: 5,
  });

  // 코인 카드 렌더링 함수
  const renderCoinCard = useCallback((ticker: TickerWithExchange) => {
    const tickerKey = `${ticker.exchange}-${ticker.symbol}`;
    const isFavorite = favorites.includes(tickerKey);

    return (
      <div
        key={tickerKey}
        className="p-1 sm:p-2 w-full"
        style={{ flex: `0 0 calc(100% / ${columnCount})` }}
      >
        <Card
          className="cursor-pointer hover:border-primary/50 transition-colors duration-150 h-full flex flex-col"
          onClick={() => {
            const symbol = encodeURIComponent(ticker.symbol);
            navigate(
              `/trade?exchange=${ticker.exchange}&symbol=${symbol}`,
            );
          }}
        >
          <CardContent className="p-2 sm:p-3 flex flex-col h-full">
            {/* 상단 정보: 거래소와 심볼 */}
            <div className="flex flex-col mb-2">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center">
                  <Avatar className="w-5 h-5 h-lg:w-6 h-lg:h-6 mr-1">
                    <AvatarImage
                      src={exchangeIcons[ticker.exchange]?.src}
                      alt={exchangeNames[ticker.exchange]} // 한글 이름 사용
                    />
                    <AvatarFallback>
                      {exchangeIcons[ticker.exchange]?.fallback}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-xs h-lg:text-sm capitalize">
                    {exchangeNames[ticker.exchange]} {/* 한글 이름 사용 */}
                  </span>
                </div>
                {onToggleFavorite && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // 카드 클릭 이벤트가 발생하지 않도록 함
                      onToggleFavorite(ticker);
                    }}
                    className="text-yellow-500 hover:text-yellow-300 flex-shrink-0 p-1 -m-1" // 클릭 영역 확보
                    aria-label={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                  >
                    <Star
                      fill={isFavorite ? "currentColor" : "none"}
                      size={16}
                      className="transition-all"
                    />
                  </button>
                )}
              </div>
              <div className="font-semibold text-sm h-lg:text-base break-words">
                {formatSymbol(ticker.symbol)}
              </div>
            </div>

            {/* 중간 부분: 추가 정보 공간 */}
            <div className="flex-grow"></div>

            {/* 하단 정보: 거래량과 가격 */}
            <div className="flex justify-between mt-2">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">
                  거래량 {/* 한글 라벨 */}
                </span>
                <span className="font-medium text-xs h-lg:text-sm truncate max-w-[60px] sm:max-w-none">
                  {formatVolume(ticker.baseVolume)}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-muted-foreground">
                  가격 {/* 한글 라벨 */}
                </span>
                <span className="font-medium text-xs h-lg:text-sm truncate max-w-[60px] sm:max-w-none">
                  {ticker.last}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }, [navigate, formatSymbol, onToggleFavorite, favorites, columnCount]);

  // 빈 공간 렌더링 함수
  const renderEmptySpace = useCallback((index: number) => {
    return (
      <div
        key={`empty-${index}`}
        className="p-1 sm:p-2"
        style={{ flex: `0 0 calc(100% / ${columnCount})` }}
      />
    );
  }, [columnCount]);

  // 가상화된 행 렌더링 함수
  const renderVirtualRow = useCallback((virtualRow: any) => {
    const rowItems = gridItems[virtualRow.index];

    return (
      <div
        key={`row-${virtualRow.index}`}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: `${cardHeight}px`,
          transform: `translateY(${virtualRow.start}px)`,
        }}
        className="flex w-full"
      >
        {/* 코인 카드 렌더링 */}
        {rowItems.map(renderCoinCard)}

        {/* 한 행에 아이템이 columnCount보다 적은 경우 빈 공간 채우기 */}
        {rowItems.length < columnCount &&
          Array.from({ length: columnCount - rowItems.length }).map(
            (_, i) => renderEmptySpace(i)
          )}
      </div>
    );
  }, [gridItems, cardHeight, renderCoinCard, renderEmptySpace, columnCount]);

  return (
    <div
      ref={gridContainerRef}
      className="overflow-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-background h-[calc(100vh-10rem)]" // 높이 조정 필요 시 수정
    >
      {/* 가상화된 그리드 */}
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) =>
          renderVirtualRow(virtualRow)
        )}
      </div>

      {/* 결과 없음 표시 */}
      {tickers.length === 0 && (
        <div className="flex items-center justify-center h-40">
          <p className="text-muted-foreground">결과가 없습니다.</p> {/* 한글 메시지 */}
        </div>
      )}
    </div>
  );
};
