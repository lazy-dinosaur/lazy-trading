import { IChartApi, ISeriesApi } from "lightweight-charts";
import { createContext } from "react";

export interface ChartContextValue {
  isRemoved: boolean;
  isLoading: boolean;
  _api?: IChartApi;
  api(): IChartApi;
  free(series: ISeriesApi<any>): void;
}

export type ChartContextType = ChartContextValue | null;

export const ChartContext = createContext<ChartContextType>(null);
