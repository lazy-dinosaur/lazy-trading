import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CapitalChangeChartProps {
  data: ChartData[];
  hourlyData: ChartData[];
  isLoading: boolean;
  height?: number;
}

// 날짜 포맷 함수
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

// 시간 포맷 함수
const formatHour = (dateTimeStr: string) => {
  const date = new Date(dateTimeStr);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

// 툴팁 커스텀 포맷터
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const date = new Date(label);
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

// 시간별 툴팁 커스텀 포맷터
const HourlyCustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const date = new Date(label);
    const formattedDateTime = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

    return (
      <div className="bg-background/95 p-2 border rounded shadow-sm">
        <p className="text-xs text-muted-foreground">{formattedDateTime}</p>
        <p className="font-medium">${formatUSDValue(payload[0].value)}</p>
      </div>
    );
  }

  return null;
};

const CapitalChangeChart = ({
  data,
  hourlyData,
  isLoading,
  height = 300,
}: CapitalChangeChartProps) => {
  const [activeTab, setActiveTab] = useState("weekly");

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

  // 시간별 데이터의 시작과 끝 시간을 문자열로 반환
  const getHourRangeText = (): string => {
    if (!hourlyData || hourlyData.length < 2) return "24시간 데이터";

    const startDateTime = new Date(hourlyData[0].time);
    const endDateTime = new Date(hourlyData[hourlyData.length - 1].time);

    // 날짜와 시간을 YYYY-MM-DD HH:MM 형식으로 변환
    const formatDateTime = (date: Date) => {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    };

    return `${formatDateTime(startDateTime)} ~ ${formatDateTime(endDateTime)}`;
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
    return {
      rate: Math.abs(rate),
      isPositive: rate >= 0,
    };
  };

  const weeklyChangeRate = calculateWeeklyChangeRate();

  // 변동률 계산 (24시간)
  const calculateHourlyChangeRate = (): {
    rate: number;
    isPositive: boolean;
  } | null => {
    if (!hourlyData || hourlyData.length < 2) return null;

    const firstValue = hourlyData[0].value;
    const lastValue = hourlyData[hourlyData.length - 1].value;

    if (firstValue === 0) return null;

    const rate = ((lastValue - firstValue) / firstValue) * 100;
    return {
      rate: Math.abs(rate),
      isPositive: rate >= 0,
    };
  };

  const hourlyChangeRate = calculateHourlyChangeRate();

  // 일주일 전 값 (기준점)
  const weeklyBaselineValue = data && data.length > 0 ? data[0].value : 0;

  // 24시간 전 값 (기준점)
  const hourlyBaselineValue =
    hourlyData && hourlyData.length > 0 ? hourlyData[0].value : 0;

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

  // 수직축 범위 계산 (기준점이 중간에 오도록 설정) - 24시간
  const calculateHourlyYDomain = () => {
    if (!hourlyData || hourlyData.length === 0) return [0, 100];

    const values = hourlyData.map((item) => item.value);
    const min = Math.min(...values);
    const max = Math.max(...values);

    // 기준점(24시간 전 값)이 중간에 오도록 계산
    const lowOffset = hourlyBaselineValue - min;
    const highOffset = max - hourlyBaselineValue;

    // 더 큰 변동폭을 기준으로 대칭적인 범위 계산
    const maxOffset = Math.max(lowOffset, highOffset) * 1.1; // 10% 여유 추가

    return [
      Math.max(0, hourlyBaselineValue - maxOffset), // 음수가 되지 않도록 방지
      hourlyBaselineValue + maxOffset,
    ];
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">자본 변동 추이</CardTitle>
            <CardDescription className="flex items-center">
              {activeTab === "weekly" ? getDateRangeText() : getHourRangeText()}
              {activeTab === "weekly" && weeklyChangeRate && (
                <span
                  className={`ml-2 ${weeklyChangeRate.isPositive ? "text-green-500" : "text-red-500"} font-medium`}
                >
                  {weeklyChangeRate.isPositive ? "↑" : "↓"}{" "}
                  {weeklyChangeRate.rate.toFixed(2)}%
                </span>
              )}
              {activeTab === "hourly" && hourlyChangeRate && (
                <span
                  className={`ml-2 ${hourlyChangeRate.isPositive ? "text-green-500" : "text-red-500"} font-medium`}
                >
                  {hourlyChangeRate.isPositive ? "↑" : "↓"}{" "}
                  {hourlyChangeRate.rate.toFixed(2)}%
                </span>
              )}
            </CardDescription>
          </div>
          {isLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
        </div>
        <Tabs
          defaultValue="weekly"
          className="mt-2"
          onValueChange={setActiveTab}
        >
          <TabsList className="grid w-52 grid-cols-2">
            <TabsTrigger value="weekly">주간</TabsTrigger>
            <TabsTrigger value="hourly">24시간</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="weekly">
          {data && data.length > 0 ? (
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
                    tickFormatter={(value) => `$${formatUSDValue(value)}`}
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
                  {/* 현재 가치가 기준보다 높으면 녹색, 낮으면 붉은색 */}
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
          ) : (
            <div className="flex justify-center items-center h-[200px] text-muted-foreground">
              {isLoading ? (
                <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              ) : (
                "표시할 자본 변동 데이터가 없습니다"
              )}
            </div>
          )}
          </TabsContent>
          <TabsContent value="hourly">
          {hourlyData && hourlyData.length > 0 ? (
            <div style={{ width: "100%", height: height }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={hourlyData.map((item) => ({
                    datetime: item.time,
                    value: item.value,
                  }))}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    {/* 상승 시 녹색 그라데이션 */}
                    <linearGradient
                      id="colorHourlyGreen"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop
                        offset="95%"
                        stopColor="#10b981"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                    {/* 하락 시 붉은색 그라데이션 */}
                    <linearGradient
                      id="colorHourlyRed"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
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
                    dataKey="datetime"
                    tickFormatter={formatHour}
                    tick={{ fontSize: 12 }}
                    stroke="#888"
                  />
                  <YAxis
                    tickFormatter={(value) => `$${formatUSDValue(value)}`}
                    tick={{ fontSize: 12 }}
                    stroke="#888"
                    width={60}
                    domain={calculateHourlyYDomain()}
                  />
                  <Tooltip content={<HourlyCustomTooltip />} />
                  {/* 기준선 (24시간 전 값) */}
                  <ReferenceLine
                    y={hourlyBaselineValue}
                    stroke="#888"
                    strokeDasharray="3 3"
                    label={{
                      value: `기준: $${formatUSDValue(hourlyBaselineValue)}`,
                      position: "insideBottomRight",
                      fill: "#888",
                      fontSize: 12,
                    }}
                  />
                  {/* 현재 가치가 기준보다 높으면 녹색, 낮으면 붉은색 */}
                  {hourlyChangeRate?.isPositive ? (
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorHourlyGreen)"
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                    />
                  ) : (
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#ef4444"
                      fillOpacity={1}
                      fill="url(#colorHourlyRed)"
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex justify-center items-center h-[200px] text-muted-foreground">
              {isLoading ? (
                <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              ) : (
                "표시할 24시간 자본 변동 데이터가 없습니다"
              )}
            </div>
          )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CapitalChangeChart;
