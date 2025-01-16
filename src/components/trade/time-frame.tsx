import React from "react";
export type TimeFrameType = "5" | "15" | "30" | "60" | "240" | "D" | "W" | "M";

export const TimeFrame = ({
  timeFrameState,
}: {
  timeFrameState: {
    timeframe: string;
    setTimeframe: React.Dispatch<
      React.SetStateAction<TimeFrameType | undefined>
    >;
  };
}) => {
  const { timeframe, setTimeframe } = timeFrameState;
  return (
    <div className="grid grid-flow-col gap-2 text-muted-foreground text-sm">
      <span
        aria-selected={timeframe == "5"}
        onClick={() => setTimeframe("5")}
        className="aria-selected:text-white aria-selected:font-semibold"
      >
        5m
      </span>
      <span
        aria-selected={timeframe == "15"}
        onClick={() => setTimeframe("15")}
        className="aria-selected:text-white aria-selected:font-semibold"
      >
        15m
      </span>
      <span
        aria-selected={timeframe == "30"}
        onClick={() => setTimeframe("30")}
        className="aria-selected:text-white aria-selected:font-semibold"
      >
        30m
      </span>
      <span
        aria-selected={timeframe == "60"}
        onClick={() => setTimeframe("60")}
        className="aria-selected:text-white aria-selected:font-semibold"
      >
        1h
      </span>
      <span
        aria-selected={timeframe == "240"}
        onClick={() => setTimeframe("240")}
        className="aria-selected:text-white aria-selected:font-semibold"
      >
        4h
      </span>
      <span
        aria-selected={timeframe == "D"}
        onClick={() => setTimeframe("D")}
        className="aria-selected:text-white aria-selected:font-semibold"
      >
        1D
      </span>
      <span
        aria-selected={timeframe == "W"}
        onClick={() => setTimeframe("W")}
        className="aria-selected:text-white aria-selected:font-semibold"
      >
        1W
      </span>
      <span
        aria-selected={timeframe == "M"}
        onClick={() => setTimeframe("M")}
        className="aria-selected:text-white aria-selected:font-semibold"
      >
        1M
      </span>
    </div>
  );
};
