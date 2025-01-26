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
    <>
      <Header {...headerProps} />
      <div className={cn(["w-full h-full flex flex-col", className])}>
        {children}
      </div>
    </>
  );
};
