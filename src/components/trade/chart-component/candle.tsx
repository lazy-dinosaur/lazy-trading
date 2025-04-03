import { ChartContext } from "@/contexts/chart/type";
import { useSettings } from "@/contexts/settings/use";
import { searchingStopLossCandle } from "@/lib/chart";
import {
  CandlestickSeriesOptions,
  ISeriesApi,
  DeepPartial,
  OhlcData,
} from "lightweight-charts";
import {
  forwardRef,
  useContext,
  useRef,
  useLayoutEffect,
  useImperativeHandle,
  useEffect,
} from "react";

export type CandleData = OhlcData & { volume: number };

interface CandleProps {
  data: CandleData[];
  children?: React.ReactNode;
  options?: DeepPartial<CandlestickSeriesOptions>;
}

// 색상 테마 정의
const lightTheme = {
  background: "#FFFFFF",
  text: "#121212",
  grid: "#E5E5E5",
  border: "#D4D4D8",
  upColor: "rgba(34, 197, 94, 0.8)", // 상승봉 - 초록
  downColor: "rgba(239, 68, 68, 0.8)", // 하락봉 - 빨강
  upVolumeColor: "rgba(34, 197, 94, 0.2)", // 상승 볼륨 - 연한 초록
  downVolumeColor: "rgba(239, 68, 68, 0.2)", // 하락 볼륨 - 연한 빨강
  highLineColor: "rgba(239, 68, 68, 0.8)", // 고점 라인 - 빨강
  lowLineColor: "rgba(34, 197, 94, 0.8)", // 저점 라인 - 초록
};

const darkTheme = {
  background: "#121212",
  text: "#F5F5F5",
  grid: "#27272A",
  border: "#3F3F46",
  upColor: "rgba(34, 197, 94, 0.8)", // 상승봉 - 초록
  downColor: "rgba(239, 68, 68, 0.8)", // 하락봉 - 빨강
  upVolumeColor: "rgba(34, 197, 94, 0.2)", // 상승 볼륨 - 연한 초록
  downVolumeColor: "rgba(239, 68, 68, 0.2)", // 하락 볼륨 - 연한 빨강
  highLineColor: "rgba(239, 68, 68, 0.8)", // 고점 라인 - 빨강
  lowLineColor: "rgba(34, 197, 94, 0.8)", // 저점 라인 - 초록
};

export const CandleSeries = forwardRef<ISeriesApi<"Candlestick">, CandleProps>(
  (props, ref) => {
    const { theme } = useSettings();
    const parent = useContext(ChartContext);
    if (!parent) {
      throw new Error("CandleSeries must be used within a Chart Context");
    }

    // 테마에 따른 색상 결정
    const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    const currentTheme = isDark ? darkTheme : lightTheme;

    const context = useRef<{
      _api: ISeriesApi<"Candlestick"> | undefined;
      _volumeApi: ISeriesApi<"Histogram"> | undefined; // 볼륨 API 추가
      _highLineApi: ISeriesApi<"Line"> | undefined;
      _lowLineApi: ISeriesApi<"Line"> | undefined;
      api: () => ISeriesApi<"Candlestick">;
      updateStopLossLines: (data: CandleData[]) => void;
      free: () => void;
    }>({
      _api: undefined,
      _volumeApi: undefined,
      _highLineApi: undefined,
      _lowLineApi: undefined,
      api() {
        if (!this._api) {
          const { data, options } = props;

          // 볼륨 시리즈 먼저 추가
          this._volumeApi = parent.api().addHistogramSeries({
            priceFormat: {
              type: "volume",
            },
            priceScaleId: "", // 메인 스케일에 오버레이
          });

          // 볼륨 데이터 설정
          const volumeData = data.map((item) => ({
            time: item.time,
            value: item.volume,
            color:
              item.close >= item.open
                ? currentTheme.upVolumeColor
                : currentTheme.downVolumeColor,
          }));
          this._volumeApi.setData(volumeData);
          this._volumeApi.priceScale().applyOptions({
            scaleMargins: {
              top: 0.7,
              bottom: 0,
            },
          });

          // 캔들 시리즈 추가
          this._api = parent.api().addCandlestickSeries({
            upColor: currentTheme.upColor,
            downColor: currentTheme.downColor,
            borderVisible: false,
            wickUpColor: currentTheme.upColor,
            wickDownColor: currentTheme.downColor,
            ...options,
          });

          // 차트 배경 및 그리드 설정
          parent.api().applyOptions({
            layout: {
              background: {
                color: currentTheme.background,
              },
              textColor: currentTheme.text,
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
            timeScale: {
              borderColor: currentTheme.border,
              timeVisible: true,
            },
            rightPriceScale: {
              borderColor: currentTheme.border,
            },
          });
          
          // 상단 라인 시리즈 추가
          this._highLineApi = parent.api().addLineSeries({
            lastPriceAnimation: 1,
            color: currentTheme.highLineColor,
            lineWidth: 1,
            lineStyle: 2, // 점선
          });

          // 하단 라인 시리즈 추가
          this._lowLineApi = parent.api().addLineSeries({
            lastPriceAnimation: 1,
            color: currentTheme.lowLineColor,
            lineWidth: 1,
            lineStyle: 2, // 점선
          });

          this._api.setData(data);
          this.updateStopLossLines(data);
        }

        return this._api;
      },
      updateStopLossLines(data: CandleData[]) {
        if (!this._highLineApi || !this._lowLineApi || data.length < 3) return;

        const highMarker = searchingStopLossCandle(
          data,
          data.length - 1,
          "high",
        );
        const lowMarker = searchingStopLossCandle(data, data.length - 1, "low");

        // 상단 라인 데이터 생성
        const highLineData = data.map((candle) => ({
          time: candle.time,
          value: highMarker.high,
        }));

        // 하단 라인 데이터 생성
        const lowLineData = data.map((candle) => ({
          time: candle.time,
          value: lowMarker.low,
        }));

        this._highLineApi.setData(highLineData);
        this._lowLineApi.setData(lowLineData);
      },
      free() {
        if (this._volumeApi && !parent.isRemoved) {
          parent.free(this._volumeApi);
        }
        if (this._highLineApi && !parent.isRemoved) {
          parent.free(this._highLineApi);
        }
        if (this._lowLineApi && !parent.isRemoved) {
          parent.free(this._lowLineApi);
        }
      },
    });

    // 테마 변경 시 차트 스타일 업데이트
    useEffect(() => {
      if (context.current._api) {
        // 캔들 스타일 업데이트
        context.current._api.applyOptions({
          upColor: currentTheme.upColor,
          downColor: currentTheme.downColor,
          wickUpColor: currentTheme.upColor,
          wickDownColor: currentTheme.downColor,
        });

        // 라인 스타일 업데이트
        if (context.current._highLineApi) {
          context.current._highLineApi.applyOptions({
            color: currentTheme.highLineColor,
          });
        }
        
        if (context.current._lowLineApi) {
          context.current._lowLineApi.applyOptions({
            color: currentTheme.lowLineColor,
          });
        }

        // 차트 배경 및 그리드 설정 업데이트
        parent.api().applyOptions({
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
          timeScale: {
            borderColor: currentTheme.border,
          },
          rightPriceScale: {
            borderColor: currentTheme.border,
          },
        });

        // 볼륨 데이터 업데이트
        if (context.current._volumeApi && props.data) {
          const volumeData = props.data.map((item) => ({
            time: item.time,
            value: item.volume,
            color:
              item.close >= item.open
                ? currentTheme.upVolumeColor
                : currentTheme.downVolumeColor,
          }));
          context.current._volumeApi.setData(volumeData);
        }
      }
    }, [theme, currentTheme]);

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

      // 캔들 데이터 업데이트
      currentRef.api().setData(data);

      // 볼륨 데이터 업데이트
      if (currentRef._volumeApi) {
        const volumeData = data.map((item) => ({
          time: item.time,
          value: item.volume,
          color:
            item.close >= item.open
              ? currentTheme.upVolumeColor
              : currentTheme.downVolumeColor,
        }));
        currentRef._volumeApi.setData(volumeData);
      }

      // 스탑로스 라인 업데이트
      currentRef.updateStopLossLines(data);
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