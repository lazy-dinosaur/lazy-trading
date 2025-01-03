import {
  CandlestickSeriesOptions,
  ISeriesApi,
  DeepPartial,
  CandlestickData,
  Time,
} from "lightweight-charts";
import {
  forwardRef,
  useContext,
  useRef,
  useLayoutEffect,
  useImperativeHandle,
} from "react";
import { ChartContext } from "@/screens/search";

export type CandleData = CandlestickData<Time>;

interface CandleProps {
  data: CandleData[];
  children?: React.ReactNode;
  options?: DeepPartial<CandlestickSeriesOptions>;
}

export const CandleSeries = forwardRef<ISeriesApi<"Candlestick">, CandleProps>(
  (props, ref) => {
    const parent = useContext(ChartContext);
    if (!parent) {
      throw new Error("CandleSeries must be used within a Chart Context");
    }

    const context = useRef<{
      _api: ISeriesApi<"Candlestick"> | undefined;
      api: () => ISeriesApi<"Candlestick">;
      free: () => void;
    }>({
      _api: undefined as ISeriesApi<"Candlestick"> | undefined,
      api() {
        if (!this._api) {
          const { data, options } = props;
          // shadcn dark theme colors
          this._api = parent.api().addCandlestickSeries({
            upColor: "#22C55ECC", // green-500 with 80% opacity (상승)
            downColor: "#EF4444CC", // red-500 with 80% opacity (하락)
            borderVisible: false,
            wickUpColor: "#22C55ECC", // green-500 with 80% opacity (상승 꼬리)
            wickDownColor: "#EF4444CC", // red-500 with 80% opacity (하락 꼬리)
            ...options,
          });

          // 차트 배경 및 그리드 설정
          parent.api().applyOptions({
            layout: {
              background: {
                color: "#0A0A0A", // zinc-950 배경색
              },
              textColor: "#FAFAFA", // zinc-200 텍스트
            },
            grid: {
              vertLines: {
                visible: false,
              },
              horzLines: {
                visible: false,
              },
            },
            timeScale: {
              borderColor: "#27272a", // zinc-800 테두리
              timeVisible: true,
            },
            rightPriceScale: {
              borderColor: "#27272a", // zinc-800 테두리
            },
          });
          this._api.setData(data);
        }
        return this._api;
      },
      free() {
        // check if parent component was removed already
        if (this._api && !parent.isRemoved) {
          // remove only current series
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
      currentRef.api().setData(data);
    }, [props.data, props.options]);

    useImperativeHandle(ref, () => context.current.api(), []);

    return (
      <ChartContext.Provider value={parent}>
        {props.children}
      </ChartContext.Provider>
    );
  },
);
CandleSeries.displayName = "CandleSeries";
