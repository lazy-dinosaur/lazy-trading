import { cn } from "@/lib/utils";
import { ClassValue } from "clsx";
import { PropsWithChildren } from "react";

type PropsType = PropsWithChildren & { className?: ClassValue[] };

export const ScreenWrapper = (props: PropsType) => {
  return (
    <div className={cn("w-max h-max space-y-3", props.className)}>
      {props.children}
    </div>
  );
};
