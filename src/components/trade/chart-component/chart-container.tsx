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
    const isDark =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
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
                color: currentTheme.background,
              },
              textColor: currentTheme.text,
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
              timeVisible: true,
              secondsVisible: false,
              tickMarkFormatter: (time: number) => {
                // 시간을 한국 시간대(UTC+9)로 표시
                const date = new Date(time * 1000);
                return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
              },
            },
            localization: {
              // 모든 시간 표시 형식 통일
              timeFormatter: (time: number) => {
                const date = new Date(time * 1000);
                const hours = date.getHours().toString().padStart(2, "0");
                const minutes = date.getMinutes().toString().padStart(2, "0");
                const month = (date.getMonth() + 1).toString().padStart(2, "0");
                const day = date.getDate().toString().padStart(2, "0");

                // 시간과 날짜를 모두 표시 (MM-DD HH:MM)
                return `${month}-${day} ${hours}:${minutes}`;
              },
            },
            crosshair: {
              // 크로스헤어(마우스 커서) 설정 추가
              horzLine: {
                visible: true,
                labelVisible: true,
              },
              vertLine: {
                visible: true,
                labelVisible: true,
                style: 1, // 점선 스타일
              },
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
              color: currentTheme.background,
            },
            textColor: currentTheme.text,
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
          localization: {
            // 시간 포맷을 테마 변경 시에도 유지
            timeFormatter: (time: number) => {
              const date = new Date(time * 1000);
              const hours = date.getHours().toString().padStart(2, "0");
              const minutes = date.getMinutes().toString().padStart(2, "0");
              const month = (date.getMonth() + 1).toString().padStart(2, "0");
              const day = date.getDate().toString().padStart(2, "0");

              // 시간과 날짜를 모두 표시 (MM-DD HH:MM)
              return `${month}-${day} ${hours}:${minutes}`;
            },
          },
          crosshair: {
            // 크로스헤어 스타일도 테마에 맞게 업데이트
            horzLine: {
              color: currentTheme.text + "80", // 색상에 투명도 추가
              labelBackgroundColor: currentTheme.background,
            },
            vertLine: {
              color: currentTheme.text + "80", // 색상에 투명도 추가
              labelBackgroundColor: currentTheme.background,
            },
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
