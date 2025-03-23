import { useCallback } from "react";
import { useSearchParams } from "react-router";
import { cn } from "@/lib/utils";

export type TimeFrameType =
  | "1"
  | "5"
  | "15"
  | "30"
  | "60"
  | "240"
  | "D"
  | "W"
  | "M";

interface TimeFrameButtonProps {
  value: TimeFrameType;
  label: string;
  isActive: boolean;
  onClick: (value: TimeFrameType) => void;
}

const TimeFrameButton = ({ value, label, isActive, onClick }: TimeFrameButtonProps) => {
  return (
    <button
      onClick={() => onClick(value)}
      className={cn(
        "px-2 py-1 rounded text-xs md:text-sm transition-all",
        "hover:bg-accent focus:outline-none focus:ring-1 focus:ring-primary",
        isActive 
          ? "bg-primary/20 text-primary font-medium" 
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
};

export const TimeFrame = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const timeframe = searchParams.get("timeframe") as TimeFrameType || "1";

  const setTimeframe = useCallback(
    (newTimeframe: TimeFrameType) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("timeframe", newTimeframe);
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams],
  );

  // 시간 프레임 옵션 정의
  const timeframeOptions: { value: TimeFrameType; label: string }[] = [
    { value: "1", label: "1m" },
    { value: "5", label: "5m" },
    { value: "15", label: "15m" },
    { value: "30", label: "30m" },
    { value: "60", label: "1h" },
    { value: "240", label: "4h" },
    { value: "D", label: "1D" },
    { value: "W", label: "1W" },
    { value: "M", label: "1M" },
  ];

  return (
    <div className="flex items-center">
      <div className="mr-2 text-xs text-muted-foreground hidden md:block">Time:</div>
      <div className="flex flex-wrap gap-1 border bg-card/50 p-1 rounded-md">
        {timeframeOptions.map((option) => (
          <TimeFrameButton
            key={option.value}
            value={option.value}
            label={option.label}
            isActive={timeframe === option.value}
            onClick={setTimeframe}
          />
        ))}
      </div>
    </div>
  );
};
