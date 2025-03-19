import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { SKELETON_SIZES } from "@/components/ui/skeleton-sizes";
import { LAYOUT } from "@/lib/constants";

interface SkeletonTableProps {
  columnWidths?: number[];
  columnNames?: string[];
  rowCount?: number;
}

/**
 * A skeleton loading state for tables with aria attributes for accessibility
 */
export const SkeletonTable = ({
  columnWidths = [40, 200, 150, 100],
  columnNames = ["", "Symbol", "Volume", "Price"],
  rowCount = 50
}: SkeletonTableProps) => {
  return (
    <div
      className="rounded-md border overflow-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-background"
      style={{ 
        height: `calc(100vh - ${LAYOUT.HEADER_HEIGHT})`, 
        "--table-height": `calc(100vh - ${LAYOUT.HEADER_HEIGHT})` 
      } as React.CSSProperties}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="sticky top-0 bg-background z-10 w-full min-w-full">
        <Table className="w-full table-auto">
          <TableHeader>
            <TableRow>
              {columnNames.map((name, i) => (
                <TableHead key={i} style={{ width: columnWidths[i] }}>
                  {i === 0 ? (
                    <Skeleton className={SKELETON_SIZES.ICON.SM} />
                  ) : (
                    name
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        </Table>
      </div>
      <Table className="w-full table-auto overflow-hidden">
        <TableBody>
          {Array.from({ length: rowCount }).map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <Skeleton className={SKELETON_SIZES.ICON.MD} aria-label="Loading icon" />
              </TableCell>
              <TableCell>
                <Skeleton className={SKELETON_SIZES.TEXT.MD} aria-label="Loading symbol" />
              </TableCell>
              <TableCell>
                <Skeleton className={SKELETON_SIZES.TEXT.SM} aria-label="Loading volume" />
              </TableCell>
              <TableCell>
                <Skeleton className={SKELETON_SIZES.TEXT.XS} aria-label="Loading price" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
