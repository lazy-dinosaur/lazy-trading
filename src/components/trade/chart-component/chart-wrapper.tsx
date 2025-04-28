import { useState, useCallback } from "react";
import { ChartContainer } from "./chart-container";
import { DeepPartial, ChartOptions } from "lightweight-charts";
import { ResponsiveContainer } from "@/components/ui/responsive-container";
import { useTrade } from "@/contexts/trade/use";
import { useTradingConfig } from "@/contexts/settings/use";
import { useTranslation } from "react-i18next";

interface ChartProps {
  layout?: DeepPartial<ChartOptions["layout"]>;
  grid?: DeepPartial<ChartOptions["grid"]>;
  timeScale?: DeepPartial<ChartOptions["timeScale"]>;
  rightPriceScale?: DeepPartial<ChartOptions["rightPriceScale"]>;
  onReachStart?: () => void; // 과거 데이터 로드를 위한 콜백
  children?: React.ReactNode;
  customHeight?: string; // 커스텀 높이 속성 추가
}

/**
 * Chart component with responsive height handling
 */
export const Chart = (props: ChartProps) => {
  const { t } = useTranslation();
  const { customHeight, ...restProps } = props; // customHeight 속성 추출
  const [container, setContainer] = useState<HTMLDivElement | false>(false);
  const handleRef = useCallback(
    (ref: HTMLDivElement | null) => setContainer(ref || false),
    [],
  );

  // 트레이드 정보와 설정 가져오기
  const { tradeInfo, tradeDirection } = useTrade();
  const { config } = useTradingConfig();

  return (
    <ResponsiveContainer
      ref={handleRef}
      heightLarge="40vh"
      heightMedium="35vh"
      heightSmall="30vh"
      mobileHeight="45vh"
      customHeight={customHeight} // 추가된 customHeight 속성 전달
    >
      {container && <ChartContainer {...restProps} container={container} />}

      {/* 차트 오버레이 정보 표시 */}
      {tradeInfo && tradeDirection && config && (
        <div className="absolute top-2 left-2 bg-background/60 p-2 rounded shadow text-xs z-10">
          <div className="font-semibold mb-1">
            {tradeDirection === "long" ? t('trade.long_position') : t('trade.short_position')} {t('trade.info')}
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <span className="text-muted-foreground">{t('trade.risk_ratio')}:</span>
            <span className="font-medium">{config?.riskRatio || 1.5}:1</span>

            {config?.partialClose && (
              <>
                <span className="text-muted-foreground">{t('trade.partial_close')}:</span>
                <span className="font-medium">{config.closeRatio}%</span>
              </>
            )}

            {tradeInfo[tradeDirection]?.stoploss && (
              <>
                <span className="text-muted-foreground">{t('trade.stoploss')}:</span>
                <span
                  className={
                    tradeDirection === "long"
                      ? "text-red-500"
                      : "text-green-500"
                  }
                >
                  {tradeInfo[tradeDirection].stoploss.formatted} (
                  {tradeInfo[tradeDirection].stoploss.percentage}%)
                </span>
              </>
            )}

            {tradeInfo[tradeDirection]?.target && (
              <>
                <span className="text-muted-foreground">{t('trade.target_price')}:</span>
                <span
                  className={
                    tradeDirection === "long"
                      ? "text-green-500"
                      : "text-red-500"
                  }
                >
                  {tradeInfo[tradeDirection].target.formatted} (
                  {tradeInfo[tradeDirection].target.percentage}%)
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </ResponsiveContainer>
  );
};
