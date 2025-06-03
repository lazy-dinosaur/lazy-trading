import { ReactNode, forwardRef } from "react";
import { cn } from "@/lib/utils";
import {
  useIsLargeHeight,
  useIsExtraLargeHeight,
  useIsMobile,
} from "@/hooks/use-mobile";

/**
 * A utility component for responsive height-based containers
 */
interface ResponsiveContainerProps {
  className?: string;
  children: ReactNode;
  heightSmall?: string;
  heightMedium?: string;
  heightLarge?: string;
  baseHeight?: string;
  mobileHeight?: string;
  customHeight?: string; // 커스텀 높이 속성 추가
}

export const ResponsiveContainer = forwardRef<
  HTMLDivElement,
  ResponsiveContainerProps
>(
  (
    {
      className,
      children,
      heightSmall = "30vh",
      heightMedium = "35vh",
      heightLarge = "40vh",
      baseHeight = heightLarge,
      mobileHeight,
      customHeight, // 커스텀 높이 추가
    },
    ref,
  ) => {
    const isLargeHeight = useIsLargeHeight();
    const isExtraLargeHeight = useIsExtraLargeHeight();
    const isMobile = useIsMobile();

    // 커스텀 높이가 지정된 경우 해당 높이 사용, 그렇지 않으면 반응형 계산
    let height = customHeight;

    if (!customHeight) {
      // 기존 반응형 높이 계산 로직
      if (isMobile && mobileHeight) {
        height = mobileHeight;
      } else if (isExtraLargeHeight) {
        height = heightSmall;
      } else if (isLargeHeight) {
        height = heightMedium;
      } else {
        height = baseHeight;
      }
    }

    return (
      <div
        ref={ref}
        className={cn("w-full rounded-md overflow-hidden", className)}
        style={{ height }}
      >
        {children}
      </div>
    );
  },
);

ResponsiveContainer.displayName = "ResponsiveContainer";
