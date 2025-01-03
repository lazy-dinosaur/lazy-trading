import { useRef } from "react";
import { ISeriesApi } from "lightweight-charts";
import { CandleSeries } from "../chart/candle";
import { Chart } from "../chart/chart";
import { TickerWithExchange } from "../search/columns";
import { TimeFrameType } from "./time-frame";

// 테스트 데이터
const data = [
  { open: 10, high: 10.63, low: 9.49, close: 9.55, time: 1642427876 },
  { open: 9.55, high: 10.3, low: 9.42, close: 9.94, time: 1642514276 },
  { open: 9.94, high: 10.17, low: 9.92, close: 9.78, time: 1642600676 },
  { open: 9.78, high: 10.59, low: 9.18, close: 9.51, time: 1642687076 },
  { open: 9.51, high: 10.46, low: 9.1, close: 10.17, time: 1642773476 },
  { open: 10.17, high: 10.96, low: 10.16, close: 10.47, time: 1642859876 },
  { open: 10.47, high: 11.39, low: 10.4, close: 10.81, time: 1642946276 },
  { open: 10.81, high: 11.6, low: 10.3, close: 10.75, time: 1643032676 },
  { open: 10.75, high: 11.6, low: 10.49, close: 10.93, time: 1643119076 },
  { open: 10.93, high: 11.53, low: 10.76, close: 10.96, time: 1643205476 },
];

const formatTime = (timestamp: number, timeFrame: TimeFrameType) => {
  const date = new Date(timestamp * 1000);

  switch (timeFrame) {
    case "5":
    case "15":
    case "30":
    case "60":
    case "240":
      // 분봉, 시간봉은 날짜와 시간 모두 표시
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hour: date.getHours(),
        minute: date.getMinutes(),
      };

    case "D":
    case "W":
    case "M":
      // 일봉, 주봉, 월봉은 날짜만 표시
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
      };

    default:
      return date.toISOString().split("T")[0];
  }
};

export const ChartComponent = ({
  timeFrame,
  tickerData,
}: {
  timeFrame: TimeFrameType;
  tickerData: TickerWithExchange;
}) => {
  const candle = useRef<ISeriesApi<"Candlestick"> | null>(null);
  // const volume = useRef<IChartApi | null>(null);

  console.log(timeFrame, tickerData);
  return (
    <Chart>
      <CandleSeries
        ref={candle}
        data={data.map((value) => ({
          ...value,
          time: formatTime(value.time, timeFrame),
        }))}
      />
    </Chart>
  );
};
