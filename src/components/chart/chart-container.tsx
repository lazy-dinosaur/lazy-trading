import {
  createChart,
  IChartApi,
  DeepPartial,
  ChartOptions,
  ISeriesApi,
  LogicalRange,
} from "lightweight-charts";
import {
  forwardRef,
  useRef,
  useLayoutEffect,
  useImperativeHandle,
  useEffect,
} from "react";
import { throttle } from "lodash";
import { ChartContext } from "@/contexts/chart-context-type";

interface ChartContainerProps {
  container: HTMLDivElement;
  layout?: DeepPartial<ChartOptions["layout"]>;
  children?: React.ReactNode;
  onReachStart?: () => void; // 과거 데이터 로드를 위한 콜백
  [key: string]: any; // 추가 ChartOptions를 위한 인덱스 시그니처
}

interface ChartApiRef {
  isRemoved: boolean;
  isLoading: boolean;
  _api?: IChartApi;
  api(): IChartApi;
  free(series: ISeriesApi<any>): void;
}

export const ChartContainer = forwardRef<IChartApi, ChartContainerProps>(
  (props, ref) => {
    const { children, container, layout, onReachStart, ...rest } = props;

    const chartApiRef = useRef<ChartApiRef>({
      isRemoved: false,
      isLoading: false,
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

    // handleRangeChange를 useEffect 내부로 이동
    useEffect(() => {
      const chart = chartApiRef.current.api();
      const handleRangeChange = throttle(
        async (range: LogicalRange | null) => {
          if (
            range?.from &&
            range.from <= 2 &&
            onReachStart &&
            !chartApiRef.current.isLoading
          ) {
            try {
              chartApiRef.current.isLoading = true;
              await Promise.resolve(onReachStart());
            } catch (error) {
              console.error("Error loading historical data:", error);
            } finally {
              chartApiRef.current.isLoading = false;
            }
          }
        },
        500,
        { leading: true, trailing: false },
      );

      // 구독 설정
      chart.timeScale().subscribeVisibleLogicalRangeChange(handleRangeChange);

      // cleanup 함수에서 구독 해제
      return () => {
        chart
          .timeScale()
          .unsubscribeVisibleLogicalRangeChange(handleRangeChange);
        handleRangeChange.cancel(); // throttle 취소
      };
    }, [onReachStart]); // onReachStart가 변경될 때마다 새로운 핸들러 등록

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
