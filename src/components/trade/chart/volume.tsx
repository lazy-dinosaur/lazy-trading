import { ChartContext } from "@/contexts/chart-context-type";
import { HistogramSeriesOptions, ISeriesApi, Time } from "lightweight-charts";
import {
  forwardRef,
  useContext,
  useLayoutEffect,
  useRef,
  useImperativeHandle,
} from "react";

interface VolumeData {
  time: Time;
  value: number;
  color?: string;
}

interface VolumeProps {
  data: VolumeData[];
  options?: Partial<HistogramSeriesOptions>;
}

export const VolumeSeries = forwardRef<ISeriesApi<"Histogram">, VolumeProps>(
  (props, ref) => {
    const parent = useContext(ChartContext);
    if (!parent) {
      throw new Error("VolumeSeries must be used within a Chart Context");
    }

    const context = useRef<{
      _api: ISeriesApi<"Histogram"> | undefined;
      api: () => ISeriesApi<"Histogram">;
      free: () => void;
    }>({
      _api: undefined,
      api() {
        if (!this._api) {
          const { data, options } = props;
          this._api = parent.api().addHistogramSeries({
            color: "#26a69a",
            priceFormat: {
              type: "volume",
            },
            priceScaleId: "", // 별도의 스케일 사용
            baseLineVisible: false,
            lastValueVisible: false,
            ...options,
          });
          // 볼륨 차트의 위치 설정
          parent.api().applyOptions({
            rightPriceScale: {
              scaleMargins: {
                top: 0.8,
                bottom: 0,
              },
            },
          });

          this._api.setData(
            data.map((d) => ({
              time: d.time,
              value: d.value,
              color: d.color || (d.value >= 0 ? "#26a69a" : "#ef5350"),
            })),
          );
        }
        return this._api;
      },
      free() {
        if (this._api && !parent.isRemoved) {
          parent.free(this._api);
        }
      },
    });

    useLayoutEffect(() => {
      const currentRef = context.current;
      currentRef.api();
      return () => currentRef.free();
    }, []);

    useLayoutEffect(() => {
      const currentRef = context.current;
      const { data, options } = props;
      if (options) {
        currentRef.api().applyOptions(options);
      }
      currentRef.api().setData(
        data.map((d) => ({
          time: d.time,
          value: d.value,
          color: d.color || (d.value >= 0 ? "#26a69a" : "#ef5350"),
        })),
      );
    }, [props.data, props.options]);

    useImperativeHandle(ref, () => context.current.api(), []);

    return null;
  },
);

VolumeSeries.displayName = "VolumeSeries";
