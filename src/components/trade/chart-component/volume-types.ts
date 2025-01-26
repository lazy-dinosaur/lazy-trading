import { HistogramSeriesOptions, ISeriesApi, Time } from "lightweight-charts";

export interface VolumeData {
  time: Time;
  value: number;
  color?: string;
}

export interface VolumeSeriesRef {
  _api?: ISeriesApi<"Histogram">;
  api: () => ISeriesApi<"Histogram">;
  free: () => void;
}

export interface VolumeProps {
  data: VolumeData[];
  options?: Partial<HistogramSeriesOptions>;
}
