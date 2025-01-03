import { cn } from "@/lib/utils";
import { PropsWithChildren } from "react";
import { ClassNameValue } from "tailwind-merge";

interface PopupContainerProps extends PropsWithChildren {
  width?: number;
  height?: number;
  className?: ClassNameValue;
}

const PopupContainer = ({ children, className }: PopupContainerProps) => {
  return (
    <div
      className={cn(
        `min-w-[400px] min-h-[300px] overflow-y-auto shadow-lg border border-gray-200 rounded-lg select-none`,
        className,
      )}
    >
      {children}
    </div>
  );
};
export default PopupContainer;
