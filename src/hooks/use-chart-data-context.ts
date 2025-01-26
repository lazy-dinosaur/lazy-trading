import { ChartDataContext } from "@/contexts/chart-data-context-type";
import { useContext } from "react";

export const useChartData = () => {
  const context = useContext(ChartDataContext);
  if (!context) {
    throw new Error("useChartData must be used within a ChartDataProvider");
  }
  return context;
};
