import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { flexRender, Table as TableType } from "@tanstack/react-table";
import { columns } from "./columns";
import { useNavigate } from "react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef, useState } from "react";
import { TickerWithExchange } from "@/lib/ccxt";

export const DataTable = ({
  table,
}: {
  table: TableType<TickerWithExchange>;
}) => {
  const navigate = useNavigate();
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const { rows } = table.getRowModel();
  const [columnSizes, setColumnSizes] = useState<number[]>([]);

  useEffect(() => {
    const updateColumnSizes = () => {
      const headers = document.querySelectorAll("th");
      const sizes = Array.from(headers).map((header) => header.clientWidth);
      setColumnSizes(sizes);
    };

    const resizeObserver = new ResizeObserver(() => {
      updateColumnSizes();
    });

    if (tableContainerRef.current) {
      resizeObserver.observe(tableContainerRef.current);
      updateColumnSizes(); // 초기 사이즈 설정
    }

    return () => resizeObserver.disconnect();
  }, []);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 45, // 예상되는 행 높이
    overscan: 10, // 추가로 렌더링할 행 수
  });

  return (
    <div
      ref={tableContainerRef}
      className="rounded-md border overflow-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-background h-full h-[calc(100vh - 10rem)]"
      style={{ height: "calc(100vh - 10rem)" }}
    >
      <div className="sticky top-0 bg-background z-10 w-full min-w-full">
        <Table className="w-full table-auto">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      style={{
                        width:
                          columnSizes[
                            table.getAllLeafColumns().indexOf(header.column)
                          ] || "auto",
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
        </Table>
      </div>
      <Table className="w-full table-auto obverflow-hidden">
        <TableBody
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];
            return (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                onClick={() => {
                  const symbol = encodeURIComponent(row.getValue("symbol"));
                  navigate(
                    `/trade?exchange=${row.getValue("exchange")}&symbol=${symbol}`,
                  );
                }}
                className="hover:bg-muted/50"
                style={{
                  overflow: "hidden",
                  position: "absolute",
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                  display: "flex",
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    style={{
                      width:
                        columnSizes[
                          table.getAllLeafColumns().indexOf(cell.column)
                        ] || "auto",
                      minWidth:
                        columnSizes[
                          table.getAllLeafColumns().indexOf(cell.column)
                        ] || "auto",
                    }}
                  >
                    <span className="flex w-full h-full items-center">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </span>
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
          {!rows.length && (
            <TableRow className="w-full">
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
