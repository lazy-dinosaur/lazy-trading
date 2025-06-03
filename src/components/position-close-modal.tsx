// React를 직접 import하지 않고 jsxRuntime 사용
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { formatUSDValue } from "@/lib/utils";

interface Position {
  id: string;
  symbol: string;
  side: "long" | "short";
  size: number;
  entryPrice: number;
  markPrice: number;
  pnl: number;
  pnlPercentage: number;
  accountId: string;
  accountName: string;
  exchange: string;
}

interface PositionCloseModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: Position | null;
  onConfirm: (position: Position) => Promise<void>;
  isClosing: boolean;
  closeError: string | null;
  isSuccess: boolean;
}

export function PositionCloseModal({
  isOpen,
  onClose,
  position,
  onConfirm,
  isClosing,
  closeError,
  isSuccess,
}: PositionCloseModalProps) {
  if (!position) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[360px] p-4 gap-2 w-[calc(100%-32px)]">
        <DialogHeader className="pb-1">
          <DialogTitle className="text-base">포지션 종료 확인</DialogTitle>
          <DialogDescription className="text-xs">
            다음 포지션을 종료하시겠습니까?
          </DialogDescription>
        </DialogHeader>

        {!isSuccess && !closeError ? (
          <>
            <div className="grid gap-2 py-1">
              <div className="grid grid-cols-2 gap-2 rounded-lg border p-3 text-sm">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">심볼</p>
                  <p className="font-semibold">{position.symbol}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">포지션</p>
                  <p className="font-semibold">
                    {position.side === "long" ? "롱" : "숏"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">사이즈</p>
                  <p className="font-semibold">{position.size}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">PnL</p>
                  <p
                    className={`font-semibold ${position.pnl >= 0 ? "text-green-500" : "text-red-500"
                      }`}
                  >
                    {position.pnl >= 0 ? "+" : ""}
                    {formatUSDValue(position.pnl)}
                  </p>
                </div>
                <div className="space-y-1 col-span-2">
                  <p className="text-xs font-medium text-muted-foreground">계정</p>
                  <p className="font-semibold text-sm">
                    {position.accountName} ({position.exchange})
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="sm:justify-between pt-1">
              <Button variant="outline" size="sm" onClick={onClose} className="h-8">
                취소
              </Button>
              <Button
                onClick={() => position && onConfirm(position)}
                disabled={isClosing}
                className="bg-red-500 hover:bg-red-600 h-8"
                size="sm"
              >
                {isClosing ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    종료 중...
                  </>
                ) : (
                  "포지션 종료"
                )}
              </Button>
            </DialogFooter>
          </>
        ) : closeError ? (
          <>
            <div className="flex flex-col items-center justify-center py-3">
              <AlertTriangle className="h-10 w-10 text-red-500 mb-2" />
              <h3 className="text-base font-semibold mb-1">종료 실패</h3>
              <p className="text-center text-xs text-muted-foreground">{closeError}</p>
            </div>
            <DialogFooter>
              <Button size="sm" onClick={onClose} className="w-full h-8">확인</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center justify-center py-3">
              <CheckCircle className="h-10 w-10 text-green-500 mb-2" />
              <h3 className="text-base font-semibold mb-1">종료 성공</h3>
              <p className="text-center text-xs text-muted-foreground">
                {position.symbol} {position.side === "long" ? "롱" : "숏"} 포지션이 성공적으로 종료되었습니다.
              </p>
            </div>
            <DialogFooter>
              <Button size="sm" onClick={onClose} className="w-full h-8">확인</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
