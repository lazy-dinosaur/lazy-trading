import { IChartApi, ISeriesApi } from "lightweight-charts";
import { createContext } from "react";

export interface ChartContextValue {
  isRemoved: boolean;
  _api?: IChartApi;
  api(): IChartApi;
  free(series: ISeriesApi<any>): void;
}

export const ChartContext = createContext<ChartContextValue | null>(null);
