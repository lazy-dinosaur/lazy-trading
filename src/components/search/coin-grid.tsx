import { TickerWithExchange } from "@/lib/ccxt";
import { formatVolume } from "@/lib/utils";
import { useNavigate } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRef, useEffect, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Star } from "lucide-react";

// 거래소 아이콘 정보
const exchangeIcons: Record<string, { src: string; fallback: string }> = {
  bybit: {
    src: "https://s2.coinmarketcap.com/static/img/exchanges/64x64/521.png",
    fallback: "Bybit",
  },
  binance: {
    src: "https://s2.coinmarketcap.com/static/img/exchanges/64x64/270.png",
    fallback: "Binance",
  },
  bitget: {
    src: "https://s2.coinmarketcap.com/static/img/exchanges/64x64/513.png",
    fallback: "Bitget",
  },
};

interface CoinGridProps {
  tickers: TickerWithExchange[];
  favorites?: string[];
  onToggleFavorite?: (ticker: TickerWithExchange) => void;
}

export const CoinGrid = ({ tickers, favorites = [], onToggleFavorite }: CoinGridProps) => {
  const navigate = useNavigate();
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(3);
  
  // 반응형 그리드 설정
  useEffect(() => {
    const updateColumnCount = () => {
      if (window.innerWidth < 400) {
        setColumnCount(1);
      } else if (window.innerWidth < 1024) {
        setColumnCount(2);
      } else {
        setColumnCount(3);
      }
    };

    updateColumnCount();
    window.addEventListener("resize", updateColumnCount);
    return () => window.removeEventListener("resize", updateColumnCount);
  }, []);

  // 그리드 항목 행 계산
  const gridItems: TickerWithExchange[][] = [];
  for (let i = 0; i < tickers.length; i += columnCount) {
    const rowItems = tickers.slice(i, i + columnCount);
    gridItems.push(rowItems);
  }

  // 가상화 스크롤링 설정
  const rowVirtualizer = useVirtualizer({
    count: gridItems.length,
    getScrollElement: () => gridContainerRef.current,
    estimateSize: () => 140, // 카드 높이 예상값
    overscan: 5,
  });

  // 카드 높이 설정
  const [cardHeight, setCardHeight] = useState(() => {
    if (window.innerHeight < 800) {
      return 120;
    } else if (window.innerHeight < 1000) {
      return 130;
    } else {
      return 140;
    }
  });

  useEffect(() => {
    const updateCardHeight = () => {
      if (window.innerHeight < 800) {
        setCardHeight(120);
      } else if (window.innerHeight < 1000) {
        setCardHeight(130);
      } else {
        setCardHeight(140);
      }
    };

    window.addEventListener("resize", updateCardHeight);
    return () => window.removeEventListener("resize", updateCardHeight);
  }, []);

  // 심볼 형식화 함수
  const formatSymbol = (symbol: string) => {
    const baseSymbol = symbol.split(":")[0];
    return baseSymbol.replace(/^[0-9]+/, "");
  };

  return (
    <div
      ref={gridContainerRef}
      className="overflow-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-background h-[calc(100vh-10rem)] h-lg:h-[calc(100vh-11rem)] h-xl:h-[calc(100vh-13rem)]"
    >
      {/* 가상화된 그리드 */}
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const rowItems = gridItems[virtualRow.index];
          return (
            <div
              key={virtualRow.index}
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
              {rowItems.map((ticker: TickerWithExchange) => (
                <div 
                  key={`${ticker.exchange}-${ticker.symbol}`}
                  className="p-1 sm:p-2 w-full"
                  style={{ flex: `0 0 calc(100% / ${columnCount})` }}
                >
                  <Card 
                    className="cursor-pointer hover:border-primary/50 transition-colors duration-150 h-full flex flex-col"
                    onClick={() => {
                      const symbol = encodeURIComponent(ticker.symbol);
                      navigate(`/trade?exchange=${ticker.exchange}&symbol=${symbol}`);
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
                                alt={ticker.exchange}
                              />
                              <AvatarFallback>{exchangeIcons[ticker.exchange]?.fallback[0]}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-xs h-lg:text-sm">{ticker.exchange}</span>
                          </div>
                          {onToggleFavorite && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // 카드 클릭 이벤트가 발생하지 않도록 함
                                onToggleFavorite(ticker);
                              }}
                              className="text-yellow-500 hover:text-yellow-300 flex-shrink-0"
                            >
                              <Star
                                fill={favorites.includes(`${ticker.exchange}-${ticker.symbol}`) ? "currentColor" : "none"}
                                size={16}
                                className="transition-all"
                              />
                            </button>
                          )}
                        </div>
                        <div className="font-semibold text-sm h-lg:text-base break-words">{formatSymbol(ticker.symbol)}</div>
                      </div>
                      
                      {/* 중간 부분: 추가 정보 공간 */}
                      <div className="flex-grow"></div>
                      
                      {/* 하단 정보: 거래량과 가격 */}
                      <div className="flex justify-between mt-2">
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">Volume</span>
                          <span className="font-medium text-xs h-lg:text-sm truncate max-w-[60px] sm:max-w-none">{formatVolume(ticker.baseVolume)}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-muted-foreground">Price</span>
                          <span className="font-medium text-xs h-lg:text-sm truncate max-w-[60px] sm:max-w-none">{ticker.last}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
              
              {/* 한 행에 아이템이 columnCount보다 적은 경우 빈 공간 채우기 */}
              {rowItems.length < columnCount &&
                Array.from({ length: columnCount - rowItems.length }).map((_, i) => (
                  <div 
                    key={`empty-${i}`} 
                    className="p-1 sm:p-2"
                    style={{ flex: `0 0 calc(100% / ${columnCount})` }}
                  />
                ))}
            </div>
          );
        })}
      </div>
      
      {/* 결과 없음 표시 */}
      {tickers.length === 0 && (
        <div className="flex items-center justify-center h-40">
          <p className="text-muted-foreground">No results found.</p>
        </div>
      )}
      
      {/* 하단 여백 추가 */}
      {tickers.length > 0 && <div className="pb-6" />}
    </div>
  );
};