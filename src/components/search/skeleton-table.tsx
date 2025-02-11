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
    <div className="rounded-md border overflow-auto h-[calc(100vh - 10rem)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead style={{ width: 30 }}>
              <Skeleton className="h-4 w-4" />
            </TableHead>
            <TableHead style={{ width: 200 }}>Symbol</TableHead>
            <TableHead style={{ width: 150 }}>Volume</TableHead>
            <TableHead style={{ width: 100 }}>Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 20 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <Skeleton className="h-5 w-5 rounded-full" />
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
