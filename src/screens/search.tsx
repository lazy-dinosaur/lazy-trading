import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  ColumnFiltersState,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";
import { columns } from "@/components/search/columns";
import Filter from "@/components/search/filter";
import { DataTable } from "@/components/search/data-table";
import { useState } from "react";
import { useAllTickers } from "@/hooks/coin";
import { ScreenWrapper } from "@/components/screen-wrapper";
import { SkeletonTable } from "@/components/search/skeleton-table";

const Search = () => {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  const { data: tickersData, isLoading } = useAllTickers();

  const table = useReactTable({
    data: tickersData ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      columnFilters,
      sorting,
    },
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    enableSorting: true,
  });

  return (
    <ScreenWrapper headerProps={{ title: "Search" }} className={["space-y-5"]}>
      <Filter table={table} />
      {isLoading ? <SkeletonTable /> : <DataTable table={table} />}
    </ScreenWrapper>
  );
};
export default Search;
