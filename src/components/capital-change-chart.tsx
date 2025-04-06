import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartData } from "@/hooks/use-balance-history";
import { formatUSDValue } from "@/lib/utils";
import { RefreshCw } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";

interface CapitalChangeChartProps {
  data: ChartData[];
  isLoading: boolean;
  isError: boolean; // isError prop 추가
  height?: number;
}

// 날짜 포맷 함수
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

// 툴팁 커스텀 포맷터 타입 정의
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: any;
  }>;
  label?: string;
}

// 툴팁 커스텀 포맷터
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const date = new Date(label as string);
    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    return (
      <div className="bg-background/95 p-2 border rounded shadow-sm">
        <p className="text-xs text-muted-foreground">{formattedDate}</p>
        <p className="font-medium">${formatUSDValue(payload[0].value)}</p>
      </div>
    );
  }

  return null;
};

const CapitalChangeChart = ({
  data,
  isLoading,
  isError, // isError prop 받기
  height = 300,
}: CapitalChangeChartProps) => {
  // 차트 데이터의 시작과 끝 날짜를 문자열로 반환
  const getDateRangeText = (): string => {
    if (!data || data.length < 2) return "7일간 데이터";

    const startDate = new Date(data[0].time);
    const endDate = new Date(data[data.length - 1].time);

    // 날짜를 YYYY-MM-DD 형식으로 변환
    const formatDate = (date: Date) => {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    };

    return `${formatDate(startDate)} ~ ${formatDate(endDate)}`;
  };

  // 변동률 계산 (주간)
  const calculateWeeklyChangeRate = (): {
    rate: number;
    isPositive: boolean;
  } | null => {
    if (!data || data.length < 2) return null;

    const firstValue = data[0].value;
    const lastValue = data[data.length - 1].value;

    if (firstValue === 0) return null;

    const rate = ((lastValue - firstValue) / firstValue) * 100;
    
    // 마지막 값이 첫 번째 값보다 크거나 같으면 양수 (상승, 녹색)
    // 마지막 값이 첫 번째 값보다 작으면 음수 (하락, 빨간색)
    const isPositive = lastValue >= firstValue;
    
    return {
      rate: Math.abs(rate),
      isPositive: isPositive,
    };
  };

  const weeklyChangeRate = calculateWeeklyChangeRate();

  // 일주일 전 값 (기준점)
  const weeklyBaselineValue = data && data.length > 0 ? data[0].value : 0;

  // 수직축 범위 계산 (기준점이 중간에 오도록 설정) - 주간
  const calculateWeeklyYDomain = () => {
    if (!data || data.length === 0) return [0, 100];

    const values = data.map((item) => item.value);
    const min = Math.min(...values);
    const max = Math.max(...values);

    // 기준점(일주일 전 값)이 중간에 오도록 계산
    const lowOffset = weeklyBaselineValue - min;
    const highOffset = max - weeklyBaselineValue;

    // 더 큰 변동폭을 기준으로 대칭적인 범위 계산
    const maxOffset = Math.max(lowOffset, highOffset) * 1.1; // 10% 여유 추가

    return [
      Math.max(0, weeklyBaselineValue - maxOffset), // 음수가 되지 않도록 방지
      weeklyBaselineValue + maxOffset,
    ];
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">자본 변동 추이</CardTitle>
            <CardDescription className="flex items-center">
              {getDateRangeText()}
              {weeklyChangeRate && (
                <span
                  className={`ml-2 ${weeklyChangeRate.isPositive ? "text-green-500" : "text-red-500"} font-medium`}
                >
                  {weeklyChangeRate.isPositive ? "↑" : "↓"}{" "}
                  {weeklyChangeRate.rate.toFixed(2)}%
                </span>
              )}
            </CardDescription>
          </div>
          {isLoading && !isError && <RefreshCw className="h-4 w-4 animate-spin" />}
          {isError && <span className="text-xs text-red-500">오류 발생</span>}
        </div>
      </CardHeader>
      <CardContent>
        {/* 에러 상태 처리 */}
        {isError ? (
          <div className="flex justify-center items-center h-[200px] text-muted-foreground text-red-500">
            데이터를 불러오는데 실패했습니다.
          </div>
        ) : /* 로딩 중이 아니고 데이터가 있을 때 차트 표시 */
        !isLoading && data && data.length > 0 ? (
          <div style={{ width: "100%", height: height }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data.map((item) => ({
                  date: item.time,
                  value: item.value,
                }))}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  {/* 상승 시 녹색 그라데이션 */}
                  <linearGradient id="colorGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop
                      offset="95%"
                      stopColor="#10b981"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  {/* 하락 시 붉은색 그라데이션 */}
                  <linearGradient id="colorRed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                    <stop
                      offset="95%"
                      stopColor="#ef4444"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12 }}
                  stroke="#888"
                />
                <YAxis
                  tickFormatter={(value: number) => `$${formatUSDValue(value)}`}
                  tick={{ fontSize: 12 }}
                  stroke="#888"
                  width={60}
                  domain={calculateWeeklyYDomain()}
                />
                <Tooltip content={<CustomTooltip />} />
                {/* 기준선 (일주일 전 값) */}
                <ReferenceLine
                  y={weeklyBaselineValue}
                  stroke="#888"
                  strokeDasharray="3 3"
                  label={{
                    value: `기준: $${formatUSDValue(weeklyBaselineValue)}`,
                    position: "insideBottomRight",
                    fill: "#888",
                    fontSize: 12,
                  }}
                />
                {/* 현재 가치가 과거(7일 전) 기준보다 높으면 녹색, 낮으면 붉은색 */}
                {weeklyChangeRate?.isPositive ? (
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorGreen)"
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                  />
                ) : (
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#ef4444"
                    fillOpacity={1}
                    fill="url(#colorRed)"
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : /* 로딩 중이거나 데이터가 없을 때 메시지 표시 */
        (
          <div className="flex justify-center items-center h-[200px] text-muted-foreground">
            {isLoading ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                데이터 로딩 중...
              </>
            ) : (
              "표시할 자본 변동 데이터가 없습니다"
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CapitalChangeChart;