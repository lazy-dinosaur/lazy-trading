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
    <div className="h-full flex flex-col overflow-hidden">
      {/* 메인 헤더 - 항상 고정 */}
      <div className="flex-none">
        <Header {...headerProps} />
      </div>

      {/* 컨텐츠 영역 */}
      <div className={cn("flex-1 w-full", className)}>{children}</div>
    </div>
  );
};
