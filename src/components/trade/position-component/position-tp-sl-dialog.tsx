import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExchangeType } from "@/lib/accounts";
import { usePositionTPSL } from "@/hooks/use-position-tp-sl";
import { Exchange } from "ccxt";
import { ArrowUpRight, ArrowDownRight, Target, Scissors } from "lucide-react";
import toast from "react-hot-toast"; // toast 추가
import { useTranslation } from "react-i18next"; // i18n 추가

interface TPSLDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: {
    symbol: string;
    side: "long" | "short";
    entryPrice: number;
    markPrice: number;
    currentTakeProfitPrice?: number;
    currentStopLossPrice?: number;
  };
  ccxtInstance?: Exchange;
  exchange?: ExchangeType;
  accountId?: string | null; // accountId의 타입을 string | null로 변경
}

export function PositionTPSLDialog({
  open,
  onOpenChange,
  position,
  ccxtInstance,
  exchange,
  accountId,
}: TPSLDialogProps) {
  const { t } = useTranslation(); // i18n 훅 사용
  const [takeProfitPrice, setTakeProfitPrice] = useState<string>("");
  const [stopLossPrice, setStopLossPrice] = useState<string>("");
  const [takeProfitPercentage, setTakeProfitPercentage] = useState<string>("");
  const [stopLossPercentage, setStopLossPercentage] = useState<string>("");

  const tpslMutation = usePositionTPSL();

  // 현재 포지션 정보를 기반으로 초기값 설정
  useEffect(() => {
    if (open && position) {
      // 타겟 가격이 있으면 설정
      if (position.currentTakeProfitPrice) {
        setTakeProfitPrice(position.currentTakeProfitPrice.toString());
        calculateTPPercentage(position.currentTakeProfitPrice);
      } else {
        // 기본값 설정하지 않음
        setTakeProfitPrice("");
        setTakeProfitPercentage("");
      }

      // 손절 가격이 있으면 설정
      if (position.currentStopLossPrice) {
        setStopLossPrice(position.currentStopLossPrice.toString());
        calculateSLPercentage(position.currentStopLossPrice);
      } else {
        // 기본값 설정하지 않음
        setStopLossPrice("");
        setStopLossPercentage("");
      }
    }
  }, [open, position]);

  // 타겟 가격 변경 시 퍼센트 계산
  const calculateTPPercentage = (price: number) => {
    if (!price || !position.entryPrice) return;

    const diff =
      position.side === "long"
        ? ((price - position.entryPrice) / position.entryPrice) * 100
        : ((position.entryPrice - price) / position.entryPrice) * 100;

    setTakeProfitPercentage(diff.toFixed(2));
  };

  // 손절 가격 변경 시 퍼센트 계산
  const calculateSLPercentage = (price: number) => {
    if (!price || !position.entryPrice) return;

    const diff =
      position.side === "long"
        ? ((position.entryPrice - price) / position.entryPrice) * 100
        : ((price - position.entryPrice) / position.entryPrice) * 100;

    setStopLossPercentage(diff.toFixed(2));
  };

  // 타겟 가격 입력 핸들러
  const handleTPPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTakeProfitPrice(value);

    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      calculateTPPercentage(numValue);
    } else {
      setTakeProfitPercentage("");
    }
  };

  // 손절 가격 입력 핸들러
  const handleSLPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStopLossPrice(value);

    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      calculateSLPercentage(numValue);
    } else {
      setStopLossPercentage("");
    }
  };

  // 타겟 퍼센트 입력 핸들러
  const handleTPPercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTakeProfitPercentage(value);

    const numValue = parseFloat(value);
    if (!isNaN(numValue) && position.entryPrice) {
      const newPrice =
        position.side === "long"
          ? position.entryPrice * (1 + numValue / 100)
          : position.entryPrice * (1 - numValue / 100);

      setTakeProfitPrice(
        newPrice.toFixed(position.symbol.includes("BTC") ? 1 : 2),
      );
    } else {
      setTakeProfitPrice("");
    }
  };

  // 손절 퍼센트 입력 핸들러
  const handleSLPercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStopLossPercentage(value);

    const numValue = parseFloat(value);
    if (!isNaN(numValue) && position.entryPrice) {
      const newPrice =
        position.side === "long"
          ? position.entryPrice * (1 - numValue / 100)
          : position.entryPrice * (1 + numValue / 100);

      setStopLossPrice(
        newPrice.toFixed(position.symbol.includes("BTC") ? 1 : 2),
      );
    } else {
      setStopLossPrice("");
    }
  };

  // 타겟 / 손절 값 설정 함수
  const handleSubmit = async () => {
    if (!ccxtInstance || !exchange) {
      toast.error(t('trade.missing_exchange_or_account'));
      return;
    }

    // null check for accountId
    const safeAccountId = accountId || "unknown";

    try {
      await tpslMutation.mutateAsync({
        ccxtInstance,
        symbol: position.symbol,
        positionSide: position.side,
        exchange,
        stopLossPrice: stopLossPrice ? parseFloat(stopLossPrice) : undefined,
        takeProfitPrice: takeProfitPrice
          ? parseFloat(takeProfitPrice)
          : undefined,
        accountId: safeAccountId,
      });

      // 성공 후 다이얼로그 닫기
      onOpenChange(false);
      toast.success(t('trade.position_tp_sl_set_success'));
    } catch (error) {
      console.error("TP/SL 설정 실패:", error);
      toast.error(t('trade.position_tp_sl_set_failed'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              {position.side === "long" ? (
                <div className="flex items-center text-green-500">
                  <ArrowUpRight className="w-5 h-5 mr-1" />
                  {t('position_tp_sl_dialog_long')}
                </div>
              ) : (
                <div className="flex items-center text-red-500">
                  <ArrowDownRight className="w-5 h-5 mr-1" />
                  {t('position_tp_sl_dialog_short')}
                </div>
              )}
              <span className="ml-2">{position.symbol}</span>
            </div>
          </DialogTitle>
          <DialogDescription>
            {position.currentTakeProfitPrice ||
            position.currentStopLossPrice ? (
              <div className="text-sm">
                {position.currentTakeProfitPrice && (
                  <div className="inline-flex items-center mr-3 text-green-500">
                    <Target className="w-3 h-3 mr-1" />
                    {t('position_tp_sl_dialog_current_tp', { price: position.currentTakeProfitPrice })}
                  </div>
                )}
                {position.currentStopLossPrice && (
                  <div className="inline-flex items-center text-red-500">
                    <Scissors className="w-3 h-3 mr-1" />
                    {t('position_tp_sl_dialog_current_sl', { price: position.currentStopLossPrice })}
                  </div>
                )}
              </div>
            ) : (
              <div>{t('position_tp_sl_dialog_set_instruction')}</div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* 진입가 및 현재가 정보 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">{t('position_tp_sl_dialog_entry_price')}</Label>
              <div className="font-medium">{position.entryPrice}</div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t('position_tp_sl_dialog_current_price')}</Label>
              <div className="font-medium">{position.markPrice}</div>
            </div>
          </div>

          {/* 타겟 가격 설정 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-green-500" />
              <Label htmlFor="tp-price" className="font-medium">
                {t('position_tp_sl_dialog_target_price')}
              </Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <Label
                    htmlFor="tp-price"
                    className="text-xs text-muted-foreground"
                  >
                    {t('position_tp_sl_dialog_price')}
                  </Label>
                  {position.currentTakeProfitPrice ? (
                    <span className="text-xs text-green-500">
                      {t('position_tp_sl_dialog_current', { price: position.currentTakeProfitPrice })}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {t('position_tp_sl_dialog_manual_input')}
                    </span>
                  )}
                </div>
                <Input
                  id="tp-price"
                  placeholder={t('position_tp_sl_dialog_target_price_placeholder')}
                  value={takeProfitPrice}
                  onChange={handleTPPriceChange}
                  className="bg-background"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <Label
                    htmlFor="tp-percentage"
                    className="text-xs text-muted-foreground"
                  >
                    {t('position_tp_sl_dialog_percent')}
                  </Label>
                  {position.currentTakeProfitPrice ? (
                    <span className="text-xs text-green-500">
                      {position.side === "long"
                        ? `+${(((position.currentTakeProfitPrice - position.entryPrice) / position.entryPrice) * 100).toFixed(2)}%`
                        : `+${(((position.entryPrice - position.currentTakeProfitPrice) / position.entryPrice) * 100).toFixed(2)}%`}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {t('position_tp_sl_dialog_manual_input')}
                    </span>
                  )}
                </div>
                <Input
                  id="tp-percentage"
                  placeholder={t('position_tp_sl_dialog_profit_percent_placeholder')}
                  value={takeProfitPercentage}
                  onChange={handleTPPercentageChange}
                  className="bg-background"
                />
              </div>
            </div>
          </div>

          {/* 손절 가격 설정 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Scissors className="w-4 h-4 text-red-500" />
              <Label htmlFor="sl-price" className="font-medium">
                {t('position_tp_sl_dialog_stoploss_price')}
              </Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <Label
                    htmlFor="sl-price"
                    className="text-xs text-muted-foreground"
                  >
                    {t('position_tp_sl_dialog_price')}
                  </Label>
                  {position.currentStopLossPrice ? (
                    <span className="text-xs text-red-500">
                      {t('position_tp_sl_dialog_current', { price: position.currentStopLossPrice })}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {t('position_tp_sl_dialog_manual_input')}
                    </span>
                  )}
                </div>
                <Input
                  id="sl-price"
                  placeholder={t('position_tp_sl_dialog_stoploss_price_placeholder')}
                  value={stopLossPrice}
                  onChange={handleSLPriceChange}
                  className="bg-background"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <Label
                    htmlFor="sl-percentage"
                    className="text-xs text-muted-foreground"
                  >
                    {t('position_tp_sl_dialog_percent')}
                  </Label>
                  {position.currentStopLossPrice ? (
                    <span className="text-xs text-red-500">
                      {position.side === "long"
                        ? `-${(((position.entryPrice - position.currentStopLossPrice) / position.entryPrice) * 100).toFixed(2)}%`
                        : `-${(((position.currentStopLossPrice - position.entryPrice) / position.entryPrice) * 100).toFixed(2)}%`}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {t('position_tp_sl_dialog_manual_input')}
                    </span>
                  )}
                </div>
                <Input
                  id="sl-percentage"
                  placeholder={t('position_tp_sl_dialog_loss_percent_placeholder')}
                  value={stopLossPercentage}
                  onChange={handleSLPercentageChange}
                  className="bg-background"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex space-x-2 sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              {t('common.cancel')}
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={tpslMutation.isPending}
            className={
              position.side === "long"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }
          >
            {tpslMutation.isPending ? t('position_tp_sl_dialog_setting') : t('position_tp_sl_dialog_set_complete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
