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
    },
    ref,
  ) => {
    const isLargeHeight = useIsLargeHeight();
    const isExtraLargeHeight = useIsExtraLargeHeight();
    const isMobile = useIsMobile();

    // Calculate the appropriate height based on screen size
    let height = baseHeight;

    if (isMobile && mobileHeight) {
      height = mobileHeight;
    } else if (isExtraLargeHeight) {
      height = heightSmall;
    } else if (isLargeHeight) {
      height = heightMedium;
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
