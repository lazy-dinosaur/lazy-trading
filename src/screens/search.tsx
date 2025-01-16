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
import { LoadingSpinner } from "@/components/loading";
import { useState } from "react";
import { useAllTickers } from "@/hooks/coin";

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
    <div
      className={"w-full space-y-5"}
      style={{ height: "calc(100vh - 10rem)" }}
    >
      <Filter table={table} />
      {!isLoading ? (
        <DataTable table={table} />
      ) : (
        <div className="fixed inset-0 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
};
export default Search;
