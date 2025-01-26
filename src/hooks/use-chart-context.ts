import { useContext } from "react";
import { ChartContext } from "@/contexts/chart-context-type";

export const useChart = () => {
  const context = useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a ChartProvider");
  }
  return context;
};
