import { PropsWithChildren } from "react";
import { ChartContextValue, ChartContext } from "./type";

interface ChartProviderProps extends PropsWithChildren {
  value: ChartContextValue;
}

export const ChartProvider = ({ children, value }: ChartProviderProps) => {
  return (
    <ChartContext.Provider value={value}>{children}</ChartContext.Provider>
  );
};
