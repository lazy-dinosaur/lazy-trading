import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SKELETON_SIZES } from "@/components/ui/skeleton-sizes";
import { useEffect, useState } from "react";

export const SkeletonGrid = ({ itemCount = 30 }: { itemCount?: number }) => {
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

  // 그리드 생성을 위한 아이템 행 계산
  const gridRows = [];
  for (let i = 0; i < itemCount; i += columnCount) {
    const rowItems = Array.from({ length: Math.min(columnCount, itemCount - i) }).map((_, index) => i + index);
    gridRows.push(rowItems);
  }

  return (
    <div
      className="overflow-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-background h-[calc(100vh-10rem)] h-lg:h-[calc(100vh-11rem)] h-xl:h-[calc(100vh-13rem)]"
      aria-busy="true"
      aria-live="polite"
    >
      {/* 그리드 스켈레톤 */}
      <div className="w-full">
        {gridRows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex w-full">
            {row.map((itemIndex) => (
              <div
                key={itemIndex}
                className="p-1 sm:p-2"
                style={{ flex: `0 0 calc(100% / ${columnCount})` }}
              >
                <Card className="h-full">
                  <CardContent className="p-2 sm:p-3 flex flex-col h-full">
                    {/* 상단 정보 스켈레톤 */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Skeleton className={SKELETON_SIZES.ICON.SM} />
                        <Skeleton className="ml-2 w-16 h-4 hidden sm:block" />
                      </div>
                      <Skeleton className="w-20 h-5" />
                    </div>
                    
                    {/* 공간 */}
                    <div className="flex-grow my-3"></div>
                    
                    {/* 하단 정보 스켈레톤 */}
                    <div className="flex justify-between mt-2">
                      <div className="flex flex-col">
                        <Skeleton className="w-12 h-3 mb-1" />
                        <Skeleton className="w-16 h-4 max-w-[60px] sm:max-w-none" />
                      </div>
                      <div className="flex flex-col items-end">
                        <Skeleton className="w-10 h-3 mb-1" />
                        <Skeleton className="w-14 h-4 max-w-[60px] sm:max-w-none" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
            
            {/* 행에 부족한 아이템이 있는 경우 빈 공간 */}
            {row.length < columnCount &&
              Array.from({ length: columnCount - row.length }).map((_, i) => (
                <div
                  key={`empty-${rowIndex}-${i}`}
                  style={{ flex: `0 0 calc(100% / ${columnCount})` }}
                  className="p-1 sm:p-2"
                />
              ))}
          </div>
        ))}
      </div>
      
      {/* 하단 여백 추가 */}
      <div className="pb-6" />
    </div>
  );
};