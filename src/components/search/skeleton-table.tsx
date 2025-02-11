import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export const SkeletonTable = () => {
  return (
    <div
      className="rounded-md border overflow-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-background h-full h-[calc(100vh - 10rem)]"
      style={{ height: "calc(100vh - 10rem)" }}
    >
      <div className="sticky top-0 bg-background z-10 w-full min-w-full">
        <Table className="w-full table-auto">
          <TableHeader>
            <TableRow>
              <TableHead style={{ width: 40 }}>
                <Skeleton className="h-4 w-4" />
              </TableHead>
              <TableHead style={{ width: 200 }}>Symbol</TableHead>
              <TableHead style={{ width: 150 }}>Volume</TableHead>
              <TableHead style={{ width: 100 }}>Price</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      </div>
      <Table className="w-full table-auto obverflow-hidden">
        <TableBody>
          {Array.from({ length: 50 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <Skeleton className="h-6 w-6 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
