import { ChartContext } from "@/contexts/chart/type";
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
} from "react";

export type CandleData = OhlcData & { volume: number };

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
                ? "rgba(34, 197, 94, 0.2)" // 상승봉 - 연한 초록
                : "rgba(239, 68, 68, 0.2)", // 하락봉 - 연한 빨강
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
            upColor: "#22C55ECC",
            downColor: "#EF4444CC",
            borderVisible: false,
            wickUpColor: "#22C55ECC",
            wickDownColor: "#EF4444CC",
            ...options,
          });

          // 차트 배경 및 그리드 설정
          parent.api().applyOptions({
            layout: {
              background: {
                color: "#0A0A0A",
              },
              textColor: "#FAFAFA",
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
              borderColor: "#27272a",
              timeVisible: true,
            },
            rightPriceScale: {
              borderColor: "#27272a",
            },
          });
          // 상단 라인 시리즈 추가
          this._highLineApi = parent.api().addLineSeries({
            lastPriceAnimation: 1,
            color: "#EF4444CC",
            lineWidth: 1,
            lineStyle: 2, // 점선
          });

          // 하단 라인 시리즈 추가
          this._lowLineApi = parent.api().addLineSeries({
            lastPriceAnimation: 1,
            color: "#22C55ECC",
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
              ? "rgba(34, 197, 94, 0.2)"
              : "rgba(239, 68, 68, 0.2)",
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
