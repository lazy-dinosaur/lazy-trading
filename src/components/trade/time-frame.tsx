import React from "react";
export type TimeFrameType = "5" | "15" | "30" | "60" | "240" | "D" | "W" | "M";

export const TimeFrame = ({
  timeFrameState,
}: {
  timeFrameState: {
    timeFrame: string;
    setTimeFrame: React.Dispatch<React.SetStateAction<TimeFrameType | null>>;
  };
}) => {
  const { timeFrame, setTimeFrame } = timeFrameState;
  return (
    <div className="grid grid-flow-col gap-2 text-zinc-400 text-xs">
      <span
        aria-selected={timeFrame == "5"}
        onClick={() => setTimeFrame("5")}
        className="aria-selected:text-white aria-selected:font-semibold"
      >
        5m
      </span>
      <span
        aria-selected={timeFrame == "15"}
        onClick={() => setTimeFrame("15")}
        className="aria-selected:text-white aria-selected:font-semibold"
      >
        15m
      </span>
      <span
        aria-selected={timeFrame == "30"}
        onClick={() => setTimeFrame("30")}
        className="aria-selected:text-white aria-selected:font-semibold"
      >
        30m
      </span>
      <span
        aria-selected={timeFrame == "60"}
        onClick={() => setTimeFrame("60")}
        className="aria-selected:text-white aria-selected:font-semibold"
      >
        1h
      </span>
      <span
        aria-selected={timeFrame == "240"}
        onClick={() => setTimeFrame("240")}
        className="aria-selected:text-white aria-selected:font-semibold"
      >
        4h
      </span>
      <span
        aria-selected={timeFrame == "D"}
        onClick={() => setTimeFrame("D")}
        className="aria-selected:text-white aria-selected:font-semibold"
      >
        1D
      </span>
      <span
        aria-selected={timeFrame == "W"}
        onClick={() => setTimeFrame("W")}
        className="aria-selected:text-white aria-selected:font-semibold"
      >
        1W
      </span>
      <span
        aria-selected={timeFrame == "M"}
        onClick={() => setTimeFrame("M")}
        className="aria-selected:text-white aria-selected:font-semibold"
      >
        1M
      </span>
    </div>
  );
};
