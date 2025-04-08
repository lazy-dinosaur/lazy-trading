import { ChartContext } from "@/contexts/chart/type";
import { useSettings } from "@/contexts/settings/use";
import { useTradingConfig } from "@/contexts/settings/use"; // 추가: useTradingConfig 훅 임포트
// import { searchingStopLossCandle } from "@/lib/chart"; // 더 이상 사용하지 않음
import {
  CandlestickSeriesOptions,
  ISeriesApi,
  DeepPartial,
  OhlcData,
  IPriceLine, // IPriceLine 타입 임포트
  LineStyle, // LineStyle 임포트
} from "lightweight-charts";
import {
  forwardRef,
  useContext,
  useRef,
  useLayoutEffect,
  useImperativeHandle,
  useEffect,
} from "react";
import { useTrade } from "@/contexts/trade/use"; // useTrade 훅 임포트

export type CandleData = OhlcData & { volume: number };

interface CandleProps {
  data: CandleData[];
  children?: React.ReactNode;
  options?: DeepPartial<CandlestickSeriesOptions>;
}

// 색상 테마 정의 (TP/SL 색상 및 부분청산 색상 추가)
const lightTheme = {
  background: "#FFFFFF",
  text: "#121212",
  grid: "#E5E5E5",
  border: "#D4D4D8",
  upColor: "rgba(34, 197, 94, 0.8)", // 캔들 상승
  downColor: "rgba(239, 68, 68, 0.8)", // 캔들 하락
  upVolumeColor: "rgba(34, 197, 94, 0.2)",
  downVolumeColor: "rgba(239, 68, 68, 0.2)",
  tpColor: "rgba(34, 197, 94, 0.9)", // TP 색상 (초록) - 고정
  slColor: "rgba(239, 68, 68, 0.9)", // SL 색상 (빨강) - 고정
  partialTpColor: "rgba(59, 130, 246, 0.9)", // 부분청산 색상 (파랑) - 추가
  labelTextColor: "#FFFFFF", // 라벨 텍스트 색상 (흰색) - 현재 사용되지 않음
};

const darkTheme = {
  background: "#121212",
  text: "#F5F5F5",
  grid: "#27272A",
  border: "#3F3F46",
  upColor: "rgba(34, 197, 94, 0.8)", // 캔들 상승
  downColor: "rgba(239, 68, 68, 0.8)", // 캔들 하락
  upVolumeColor: "rgba(34, 197, 94, 0.2)",
  downVolumeColor: "rgba(239, 68, 68, 0.2)",
  tpColor: "rgba(34, 197, 94, 0.9)", // TP 색상 (초록) - 고정
  slColor: "rgba(239, 68, 68, 0.9)", // SL 색상 (빨강) - 고정
  partialTpColor: "rgba(96, 165, 250, 0.9)", // 부분청산 색상 (파랑) - 추가 (다크모드에 맞게 조정)
  labelTextColor: "#FFFFFF", // 라벨 텍스트 색상 (흰색) - 현재 사용되지 않음
};

export const CandleSeries = forwardRef<ISeriesApi<"Candlestick">, CandleProps>(
  (props, ref) => {
    const { theme } = useSettings();
    const parent = useContext(ChartContext);
    const { tradeInfo, tradeDirection } = useTrade(); // tradeInfo와 tradeDirection 가져오기

    if (!parent) {
      throw new Error("CandleSeries must be used within a Chart Context");
    }

    const isDark =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    const currentTheme = isDark ? darkTheme : lightTheme;

    // 가격 라인 참조 저장
    const slPriceLineRef = useRef<IPriceLine | null>(null);
    const tpPriceLineRef = useRef<IPriceLine | null>(null);
    const partialTPPriceLineRef = useRef<IPriceLine | null>(null); // 부분청산 라인 참조 추가

    const context = useRef<{
      _api: ISeriesApi<"Candlestick"> | undefined;
      _volumeApi: ISeriesApi<"Histogram"> | undefined;
      api: () => ISeriesApi<"Candlestick">;
      free: () => void;
    }>({
      _api: undefined,
      _volumeApi: undefined,
      api() {
        if (!this._api) {
          const { data, options } = props;

          // 볼륨 시리즈 추가
          this._volumeApi = parent.api().addHistogramSeries({
            priceFormat: { type: "volume" },
            priceScaleId: "",
          });
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
            scaleMargins: { top: 0.7, bottom: 0 },
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
              background: { color: currentTheme.background },
              textColor: currentTheme.text,
            },
            grid: {
              vertLines: { color: currentTheme.grid, visible: true },
              horzLines: { color: currentTheme.grid, visible: true },
            },
            timeScale: { borderColor: currentTheme.border, timeVisible: true },
            rightPriceScale: { borderColor: currentTheme.border },
          });

          // 캔들 데이터 설정
          this._api.setData(data);
        }
        return this._api;
      },
      free() {
        // 볼륨 시리즈 제거
        if (this._volumeApi && !parent.isRemoved) {
          parent.free(this._volumeApi);
        }
        // 가격 라인 제거 (컴포넌트 unmount 시)
        if (this._api) {
          // _api가 정의되어 있을 때만 removePriceLine 호출
          if (slPriceLineRef.current) {
            this._api.removePriceLine(slPriceLineRef.current);
          }
          if (tpPriceLineRef.current) {
            this._api.removePriceLine(tpPriceLineRef.current);
          }
          if (partialTPPriceLineRef.current) {
            this._api.removePriceLine(partialTPPriceLineRef.current);
          }
        }
        slPriceLineRef.current = null;
        tpPriceLineRef.current = null;
        partialTPPriceLineRef.current = null;
      },
    });

    // 거래 설정 가져오기
    const { config } = useTradingConfig();

    // tradeInfo, tradeDirection, 테마 변경 시 가격 라인 업데이트
    useEffect(() => {
      const seriesApi = context.current._api; // 시리즈 API 가져오기

      // --- 기존 라인 제거 로직 ---
      if (seriesApi) {
        if (slPriceLineRef.current) {
          seriesApi.removePriceLine(slPriceLineRef.current);
          slPriceLineRef.current = null;
        }
        if (tpPriceLineRef.current) {
          seriesApi.removePriceLine(tpPriceLineRef.current);
          tpPriceLineRef.current = null;
        }
        if (partialTPPriceLineRef.current) {
          seriesApi.removePriceLine(partialTPPriceLineRef.current);
          partialTPPriceLineRef.current = null;
        }
      }
      // --- 기존 라인 제거 로직 끝 ---

      // --- 새로운 라인 생성 조건 확인 ---
      if (!seriesApi || !tradeInfo || !tradeDirection) {
        return;
      }

      const directionInfo = tradeInfo[tradeDirection];
      if (!directionInfo || !directionInfo.stoploss || !directionInfo.target) {
        return;
      }

      const slPrice = directionInfo.stoploss.price;
      const tpPrice = directionInfo.target.price;
      // --- 새로운 라인 생성 조건 확인 끝 ---

      // --- 새로운 라인 생성 ---
      // SL 라인 생성 (항상 빨간색)
      if (slPrice) {
        slPriceLineRef.current = seriesApi.createPriceLine({
          price: slPrice,
          color: currentTheme.slColor, // 고정된 빨간색 사용
          lineWidth: 2,
          lineStyle: LineStyle.Dashed, // 점선 스타일
          axisLabelVisible: true,
          title: "SL",
        });
      }

      // TP 라인 생성 - 손익비 정보 추가 (항상 초록색)
      if (tpPrice && !config?.partialClose) {
        tpPriceLineRef.current = seriesApi.createPriceLine({
          price: tpPrice,
          color: currentTheme.tpColor, // 고정된 초록색 사용
          lineWidth: 2,
          lineStyle: LineStyle.Solid, // 실선 스타일
          axisLabelVisible: true,
          title: `TP (${config?.riskRatio || 1.5}:1)`, // 손익비 표시
        });
      }

      // 부분청산 활성화된 경우 부분청산 정보 표시 (항상 파란색)
      if (config?.partialClose && tpPrice) {
        partialTPPriceLineRef.current = seriesApi.createPriceLine({
          price: tpPrice, // 같은 가격에 위치
          color: currentTheme.partialTpColor, // 고정된 파란색 사용
          lineWidth: 1,
          lineStyle: LineStyle.Dotted, // 점선 스타일로 구분
          axisLabelVisible: true,
          title: `TP (${config.riskRatio}:1) ${config.closeRatio}% 청산`, // 부분청산 비율 표시
        });
      }
      // --- 새로운 라인 생성 끝 ---
    }, [
      tradeInfo,
      tradeDirection, // tradeDirection은 여전히 필요 (directionInfo를 가져오기 위해)
      theme,
      currentTheme,
      context.current._api,
      config,
    ]); // config 의존성 추가

    // 테마 변경 시 차트 스타일 업데이트 (볼륨, 캔들, 배경 등)
    useEffect(() => {
      if (context.current._api) {
        // 캔들 스타일 업데이트
        context.current._api.applyOptions({
          upColor: currentTheme.upColor,
          downColor: currentTheme.downColor,
          wickUpColor: currentTheme.upColor,
          wickDownColor: currentTheme.downColor,
        });

        // 차트 배경 및 그리드 설정 업데이트
        parent.api().applyOptions({
          layout: {
            background: { color: currentTheme.background },
            textColor: currentTheme.text,
          },
          grid: {
            vertLines: { color: currentTheme.grid },
            horzLines: { color: currentTheme.grid },
          },
          timeScale: { borderColor: currentTheme.border },
          rightPriceScale: { borderColor: currentTheme.border },
        });

        // 볼륨 데이터 업데이트 (색상 변경)
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
        // 가격 라인 업데이트는 다른 useEffect에서 처리
      }
    }, [theme, currentTheme, props.data]); // tradeDirection 제거

    useLayoutEffect(() => {
      const currentRef = context.current;
      currentRef.api(); // 차트 API 초기화

      return () => currentRef.free(); // 컴포넌트 unmount 시 정리
    }, []);

    // 데이터 또는 옵션 변경 시 업데이트
    useLayoutEffect(() => {
      const currentRef = context.current;
      const { data, options } = props;

      if (!currentRef._api) return; // API가 아직 준비되지 않았으면 리턴

      if (options) {
        currentRef._api.applyOptions(options);
      }

      // 캔들 데이터 업데이트
      currentRef._api.setData(data);

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

      // 가격 라인 업데이트는 tradeInfo/tradeDirection 변경 시 useEffect에서 처리
    }, [props.data, props.options, currentTheme]); // currentTheme 추가 (볼륨 색상 업데이트 위해)

    useImperativeHandle(ref, () => context.current.api(), []);

    return (
      <ChartContext.Provider value={parent}>
        {props.children}
      </ChartContext.Provider>
    );
  },
);
CandleSeries.displayName = "CandleSeries";
