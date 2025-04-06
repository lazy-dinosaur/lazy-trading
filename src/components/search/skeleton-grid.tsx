import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SKELETON_SIZES } from "@/components/ui/skeleton-sizes";
import { useEffect, useState, useMemo } from "react";

export const SkeletonGrid = ({ itemCount = 30 }: { itemCount?: number }) => {
  // 기본값 설정 (초기 렌더링에서 사용)
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

  // useMemo를 사용하여 그리드 행을 계산 - 렌더링할 때마다 새로 계산하지 않도록 최적화
  const gridRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < itemCount; i += columnCount) {
      const rowItems = Array.from({
        length: Math.min(columnCount, itemCount - i),
      }).map((_, index) => i + index);
      rows.push(rowItems);
    }
    return rows;
  }, [itemCount, columnCount]);

  // 스켈레톤 아이템 렌더링 함수
  const renderSkeletonItem = (itemIndex: number) => (
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
  );

  // 빈 공간 렌더링 함수
  const renderEmptySpace = (rowIndex: number, index: number) => (
    <div
      key={`empty-${rowIndex}-${index}`}
      style={{ flex: `0 0 calc(100% / ${columnCount})` }}
      className="p-1 sm:p-2"
    />
  );

  return (
    <div
      className="overflow-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-background h-[calc(100vh-10rem)]"
      aria-busy="true"
      aria-live="polite"
    >
      {/* 그리드 스켈레톤 */}
      <div className="w-full">
        {gridRows.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex w-full">
            {/* 스켈레톤 아이템 렌더링 */}
            {row.map(renderSkeletonItem)}

            {/* 부족한 아이템이 있는 경우 빈 공간 채우기 */}
            {row.length < columnCount &&
              Array.from({ length: columnCount - row.length }).map((_, index) =>
                renderEmptySpace(rowIndex, index),
              )}
          </div>
        ))}
      </div>
    </div>
  );
};
