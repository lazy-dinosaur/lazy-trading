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
import { useState } from "react";
import { DataTable } from "@/components/search/data-table";
import { LoadingSpinner } from "@/components/Loading";

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
    <div className="w-[450px] h-full">
      {!isLoading ? (
        <>
          <Filter table={table} /> <DataTable table={table} />
        </>
      ) : (
        <LoadingSpinner />
      )}
    </div>
  );
};
export default Search;
