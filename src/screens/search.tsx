import { useExchange } from "@/hooks/useExchange";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  ColumnFiltersState,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { columns } from "@/components/search/columns";
import Filter from "@/components/search/filter";
import { DataTable } from "@/components/search/data-table";
import { LoadingSpinner } from "@/components/loading";
import { ScreenWrapper } from "@/components/screen-wrapper";
import { createContext, useState } from "react";
import { IChartApi, ISeriesApi } from "lightweight-charts";

export interface ChartContextValue {
  isRemoved: boolean;
  _api?: IChartApi;
  api(): IChartApi;
  free(series: ISeriesApi<any>): void;
}

export const ChartContext = createContext<ChartContextValue | null>(null);

const Search = () => {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const {
    tickerData: { data, isLoading },
  } = useExchange();

  const table = useReactTable({
    data: data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnFilters,
    },
    onColumnFiltersChange: setColumnFilters,
  });

  return (
    <>
      {!isLoading ? (
        <ScreenWrapper className={["min-w-full"]}>
          <Filter table={table} /> <DataTable table={table} />
        </ScreenWrapper>
      ) : (
        <LoadingSpinner />
      )}
    </>
  );
};
export default Search;
