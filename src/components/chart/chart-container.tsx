import {
  createChart,
  IChartApi,
  DeepPartial,
  ChartOptions,
  ISeriesApi,
} from "lightweight-charts";
import {
  forwardRef,
  useRef,
  useLayoutEffect,
  useImperativeHandle,
  useEffect,
} from "react";
import { ChartContext } from "@/screens/search";

interface ChartContainerProps {
  container: HTMLDivElement;
  layout?: DeepPartial<ChartOptions["layout"]>;
  children?: React.ReactNode;
  [key: string]: any; // 추가 ChartOptions를 위한 인덱스 시그니처
}

interface ChartApiRef {
  isRemoved: boolean;
  _api?: IChartApi;
  api(): IChartApi;
  free(series: ISeriesApi<any>): void;
}

export const ChartContainer = forwardRef<IChartApi, ChartContainerProps>(
  (props, ref) => {
    const { children, container, layout, ...rest } = props;

    const chartApiRef = useRef<ChartApiRef>({
      isRemoved: false,
      api() {
        if (!this._api) {
          this._api = createChart(container, {
            ...rest,
            layout: { ...layout, attributionLogo: false, fontSize: 10 },
            width: container.clientWidth,
            height: container.clientHeight,
            watermark: {
              visible: false,
            },
            rightPriceScale: {
              borderVisible: false,
              minimumWidth: 10,
            },
            timeScale: {
              borderVisible: false,
            },
          });
          this._api.timeScale().fitContent();
        }
        return this._api;
      },
      free(series) {
        if (this._api && series) {
          this._api.removeSeries(series);
        }
      },
    });

    useLayoutEffect(() => {
      const currentRef = chartApiRef.current;
      const chart = currentRef.api();

      const handleResize = () => {
        chart.applyOptions({
          ...rest,
          width: container.clientWidth,
          height: container.clientHeight,
        });
      };

      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
        chartApiRef.current.isRemoved = true;
        chart.remove();
      };
    }, []);

    useLayoutEffect(() => {
      const currentRef = chartApiRef.current;
      currentRef.api();
    }, []);

    useLayoutEffect(() => {
      const currentRef = chartApiRef.current;
      currentRef.api().applyOptions(rest);
    }, []);

    useImperativeHandle(ref, () => chartApiRef.current.api(), []);

    useEffect(() => {
      const currentRef = chartApiRef.current;
      currentRef.api().applyOptions({ layout });
    }, [layout]);

    return (
      <ChartContext.Provider value={chartApiRef.current}>
        {children}
      </ChartContext.Provider>
    );
  },
);
ChartContainer.displayName = "ChartContainer";
