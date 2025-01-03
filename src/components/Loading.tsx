import { Loader2 } from "lucide-react";

export function LoadingSpinner() {
  return (
    <div className="flex w-full h-full min-h-[300px] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
