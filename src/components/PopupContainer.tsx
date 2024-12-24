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
        `w-[450px] max-h-[600px] overflow-y-auto p-4 shadow-lg border border-gray-200 rounded-lg`,
        className,
      )}
    >
      {children}
    </div>
  );
};
export default PopupContainer;
