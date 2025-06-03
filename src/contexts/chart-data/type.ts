import { CandleData } from "@/components/trade/chart-component/candle";
import { createContext } from "react";

interface ChartDataContextType {
  data: CandleData[];
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  handleScroll: () => Promise<void>;
  chartformat: {
    precision: number;
    minMove: number;
  };
}

export const ChartDataContext = createContext<ChartDataContextType | null>(
  null,
);
