import { Skeleton } from "@/components/ui/skeleton";

export const SkeletonSortControls = () => {
  return (
    <div className="flex justify-between items-center space-x-4 p-2 bg-background border-b">
      <Skeleton className="w-40 h-8" /> {/* 탭 스켈레톤 */}
      
      <div className="flex space-x-4">
        <Skeleton className="w-16 h-5" />
        <Skeleton className="w-16 h-5" />
        <Skeleton className="w-16 h-5" />
      </div>
    </div>
  );
};
