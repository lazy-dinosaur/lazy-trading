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
import { useEffect, useState } from "react";
import { useAllTickers } from "@/hooks/coin";
import { ScreenWrapper } from "@/components/screen-wrapper";
import { SkeletonTable } from "@/components/search/skeleton-table";
import { TickerWithExchange } from "@/lib/ccxt";
import { useCCXT } from "@/contexts/ccxt/use";

const Search = () => {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "baseVolume",
      desc: true,
    },
  ]);
  const { data: tickersData, isLoading } = useAllTickers();
  const [formattedTickers, setFormattedTickers] = useState<
    TickerWithExchange[]
  >([]);
  const ccxt = useCCXT();

  useEffect(() => {
    if (!tickersData || isLoading || !ccxt) return;

    const formatted = tickersData.map((ticker) => ({
      ...ticker,
      last: ccxt[ticker.exchange].ccxt.priceToPrecision(
        ticker.symbol,
        ticker.last,
      ),
    }));
    console.log(formatted);

    setFormattedTickers(formatted as any);
  }, [tickersData, isLoading, ccxt]);

  const table = useReactTable({
    data: formattedTickers,
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
