import { useState, useCallback } from "react";
import { ChartContainer } from "./chart-container";
import { DeepPartial, ChartOptions } from "lightweight-charts";
import { ResponsiveContainer } from "@/components/ui/responsive-container";

interface ChartProps {
  layout?: DeepPartial<ChartOptions["layout"]>;
  grid?: DeepPartial<ChartOptions["grid"]>;
  timeScale?: DeepPartial<ChartOptions["timeScale"]>;
  rightPriceScale?: DeepPartial<ChartOptions["rightPriceScale"]>;
  onReachStart?: () => void; // 과거 데이터 로드를 위한 콜백
  children?: React.ReactNode;
}

/**
 * Chart component with responsive height handling
 */
export const Chart = (props: ChartProps) => {
  const [container, setContainer] = useState<HTMLDivElement | false>(false);
  const handleRef = useCallback(
    (ref: HTMLDivElement | null) => setContainer(ref || false),
    [],
  );
  
  return (
    <ResponsiveContainer
      ref={handleRef}
      heightLarge="40vh"
      heightMedium="35vh"
      heightSmall="30vh"
      mobileHeight="45vh"
    >
      {container && <ChartContainer {...props} container={container} />}
    </ResponsiveContainer>
  );
};
