import { ClassValue } from "clsx";
import { PropsWithChildren } from "react";
import Header, { HeaderType } from "./header";
import { cn } from "@/lib/utils";

type PropsType = PropsWithChildren & {
  className?: ClassValue;
  headerProps: HeaderType;
};

export const ScreenWrapper = ({
  children,
  headerProps,
  className,
}: PropsType) => {
  return (
    <div className="h-screen flex flex-col overflow-hidden space-y-2 h-lg:space-y-3 h-xl:space-y-6">
      <Header {...headerProps} />
      <div
        className={cn(
          "flex-1 w-full overflow-hidden space-y-1.5 h-lg:space-y-3 h-xl:space-y-5",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
};
