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
import { ChartContext } from "@/contexts/chart/type";
import { useSettings } from "@/contexts/settings/use";

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

// 색상 테마 정의
const lightTheme = {
  background: "#FFFFFF",
  text: "#121212",
  grid: "#E5E5E5",
  border: "#D4D4D8",
};

const darkTheme = {
  background: "#121212",
  text: "#F5F5F5",
  grid: "#27272A",
  border: "#3F3F46",
};

export const ChartContainer = forwardRef<IChartApi, ChartContainerProps>(
  (props, ref) => {
    const { children, container, layout, onReachStart, ...rest } = props;
    const { theme } = useSettings();

    // 테마에 따른 색상 결정
    const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    const currentTheme = isDark ? darkTheme : lightTheme;

    const chartApiRef = useRef<ChartApiRef>({
      isRemoved: false,
      isLoading: false,
      api() {
        if (!this._api) {
          this._api = createChart(container, {
            ...rest,
            layout: { 
              ...layout, 
              attributionLogo: false, 
              fontSize: 10,
              background: { 
                color: currentTheme.background
              },
              textColor: currentTheme.text
            },
            width: container.clientWidth,
            height: container.clientHeight,
            watermark: {
              visible: false,
            },
            rightPriceScale: {
              borderVisible: false,
              minimumWidth: 10,
              borderColor: currentTheme.border,
            },
            timeScale: {
              borderVisible: false,
              borderColor: currentTheme.border,
            },
            grid: {
              vertLines: {
                color: currentTheme.grid,
                visible: true,
              },
              horzLines: {
                color: currentTheme.grid,
                visible: true,
              },
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

    // 테마 변경 시 차트 스타일 업데이트
    useEffect(() => {
      if (chartApiRef.current._api) {
        chartApiRef.current._api.applyOptions({
          layout: {
            background: { 
              color: currentTheme.background
            },
            textColor: currentTheme.text
          },
          grid: {
            vertLines: {
              color: currentTheme.grid,
            },
            horzLines: {
              color: currentTheme.grid,
            },
          },
          rightPriceScale: {
            borderColor: currentTheme.border,
          },
          timeScale: {
            borderColor: currentTheme.border,
          },
        });
      }
    }, [theme, currentTheme]);

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