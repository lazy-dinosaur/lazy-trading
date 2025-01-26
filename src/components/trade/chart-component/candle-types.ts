import {
  CandlestickSeriesOptions,
  DeepPartial,
  ISeriesApi,
  OhlcData,
} from "lightweight-charts";

export type CandleData = OhlcData & { volume: number };

export interface CandleSeriesRef {
  _api?: ISeriesApi<"Candlestick">;
  _volumeApi?: ISeriesApi<"Histogram">;
  _highLineApi?: ISeriesApi<"Line">;
  _lowLineApi?: ISeriesApi<"Line">;
  api: () => ISeriesApi<"Candlestick">;
  updateStopLossLines: (data: CandleData[]) => void;
  free: () => void;
}

export interface CandleProps {
  data: CandleData[];
  children?: React.ReactNode;
  options?: DeepPartial<CandlestickSeriesOptions>;
}
