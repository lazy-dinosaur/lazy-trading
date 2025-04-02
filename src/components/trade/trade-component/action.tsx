import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAccounts } from "@/contexts/accounts/use";
import { useTradingConfig } from "@/contexts/settings/use";
import { useTrade } from "@/contexts/trade/use";
import { ExchangeType } from "@/lib/accounts";
import { ChevronUp, ChevronDown, AlertTriangle, Info } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router";
import { useTradeMutation } from "@/hooks/use-trade-mutation";
import { PositionInfo } from "@/lib/trade";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TradingActionProps {
  tradeDirection?: "long" | "short";
}

export const TradingAction = ({
  tradeDirection = "long",
}: TradingActionProps) => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const exchange = searchParams.get("exchange") as ExchangeType;
  const symbol = searchParams.get("symbol");
  const { accountsBalance, decryptedAccounts } = useAccounts();
  const { tradeInfo } = useTrade();
  const accountInfo = !!(id && accountsBalance) && accountsBalance[id];
  const account = !!(id && decryptedAccounts) && decryptedAccounts[id];
  const { config } = useTradingConfig();
  const tradeMutation = useTradeMutation();

  // 설정 패널 열기/닫기 상태
  const [settingsOpen, setSettingsOpen] = useState(true);

  const handleTrade = async () => {
    if (
      !accountInfo ||
      !account ||
      !symbol ||
      !exchange ||
      !tradeInfo ||
      !tradeInfo.long ||
      !tradeInfo.short ||
      !config
    )
      return;

    const ccxtInstance = account.exchangeInstance.ccxt;
    const info = tradeInfo[tradeDirection] as PositionInfo;

    if (!info.position) return;

    try {
      await tradeMutation.mutateAsync({
        ccxtInstance,
        symbol,
        tradeType: tradeDirection,
        exchange,
        info,
        config,
      });
    } catch (error) {
      console.error("Trade execution failed:", error);
    }
  };

  // 트레이드 방향에 따른 스타일 설정
  const buttonStyle =
    tradeDirection === "long"
      ? "bg-gradient-to-b from-green-500 to-green-600 hover:from-green-400 hover:to-green-500"
      : "bg-gradient-to-b from-red-500 to-red-600 hover:from-red-400 hover:to-red-500";

  const directionText = tradeDirection === "long" ? "롱" : "숏";

  // 거래 요약 정보
  const getTradeSummary = () => {
    if (!tradeInfo?.[tradeDirection]) return null;

    const info = tradeInfo[tradeDirection];

    // 자본 부족 메시지 표시
    if (info.insufficientCapital) {
      return (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm">레버리지:</span>
            <span className="text-sm font-medium">{info.leverage}x</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">손절가:</span>
            <span
              className={`text-sm font-medium ${tradeDirection === "long" ? "text-red-500" : "text-green-500"}`}
            >
              {info.stoploss.formatted} ({info.stoploss.percentage}%)
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">목표가:</span>
            <span
              className={`text-sm font-medium ${tradeDirection === "long" ? "text-green-500" : "text-red-500"}`}
            >
              {info.target.formatted} ({info.target.percentage}%)
            </span>
          </div>
          <div className="mt-2 p-2 bg-yellow-100/20 border border-yellow-300/30 rounded-md text-yellow-600 text-xs">
            <AlertTriangle className="h-3 w-3 inline-block mr-1" />
            자본이 부족합니다. 더 많은 자본이 필요합니다.
          </div>
        </div>
      );
    }

    // 오류 메시지 표시
    if (info.error) {
      return (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm">레버리지:</span>
            <span className="text-sm font-medium">{info.leverage}x</span>
          </div>
          <div className="mt-2 p-2 bg-red-100/20 border border-red-300/30 rounded-md text-red-600 text-xs">
            <AlertTriangle className="h-3 w-3 inline-block mr-1" />
            계산 중 오류가 발생했습니다.
          </div>
        </div>
      );
    }

    // 포지션 정보가 없는 경우
    if (!info.position) {
      return (
        <div className="text-sm text-center text-muted-foreground">
          정보 없음
        </div>
      );
    }

    // 기존 코드
    return (
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm">레버리지:</span>
          <span className="text-sm font-medium">{info.leverage}x</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm">손절가:</span>
          <span
            className={`text-sm font-medium ${tradeDirection === "long" ? "text-red-500" : "text-green-500"}`}
          >
            {info.stoploss.formatted} ({info.stoploss.percentage}%)
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm">목표가:</span>
          <span
            className={`text-sm font-medium ${tradeDirection === "long" ? "text-green-500" : "text-red-500"}`}
          >
            {info.target.formatted} ({info.target.percentage}%)
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-between h-full w-full rounded-md p-2">
      {/* 거래 설정 헤더 */}
      <div
        className="w-full mb-2 cursor-pointer flex items-center justify-between"
        onClick={() => setSettingsOpen(!settingsOpen)}
      >
        <div className="text-sm font-medium border-b pb-1 flex items-center gap-1">
          <span>거래 설정</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>손익비, 리스크 비율 등 거래 설정을 조정하세요</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <span className="text-xs text-muted-foreground">
          {settingsOpen ? "접기" : "펼치기"}
        </span>
      </div>

      {/* 설정 패널 */}
      {settingsOpen && (
        <div className="space-y-3 w-full bg-accent/10 p-2 rounded-md mb-2">
          <CloseSetting />
          <RiskSetting />
          <TradingSetting />
        </div>
      )}

      {/* 거래 요약 정보 */}
      <div className="w-full">
        <Card
          className={cn(
            "border",
            tradeDirection === "long"
              ? "bg-green-100/10 border-green-200/20"
              : "bg-red-100/10 border-red-200/20",
          )}
        >
          <CardContent className="p-3">
            <div
              className={cn(
                "text-center text-sm font-semibold mb-2",
                tradeDirection === "long" ? "text-green-600" : "text-red-600",
              )}
            >
              {directionText} 거래 요약
            </div>
            {getTradeSummary() || (
              <div className="text-sm text-center text-muted-foreground">
                정보 없음
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 계정 선택 오류 */}
      {!accountInfo && (
        <div className="w-full flex items-center gap-2 p-2 bg-yellow-100/20 border border-yellow-300/30 rounded-md mb-3 text-yellow-600">
          <AlertTriangle className="h-4 w-4 flex-none" />
          <p className="text-sm">거래하기 전에 계정을 선택해주세요.</p>
        </div>
      )}

      {/* 거래 버튼 영역 */}
      <div className="w-full mt-auto">
        <Button
          onClick={handleTrade}
          className={cn(
            "w-full py-3 text-base font-bold shadow-md hover:shadow-lg transition-all",
            buttonStyle,
          )}
          disabled={
            !accountInfo ||
            tradeMutation.isPending ||
            !!tradeInfo?.[tradeDirection]?.insufficientCapital ||
            !!tradeInfo?.[tradeDirection]?.error
          }
        >
          {tradeMutation.isPending ? "처리중..." : `${directionText} 진입`}
        </Button>
      </div>
    </div>
  );
};

// 설정 컨트롤 컴포넌트 개선
interface SettingControlProps {
  label: string;
  value: number | string;
  unit: string;
  onDecrease: () => void;
  onIncrease: () => void;
  disabled?: boolean;
  tooltipText?: string;
}

const SettingControl = ({
  label,
  value,
  unit,
  onDecrease,
  onIncrease,
  disabled = false,
  tooltipText,
}: SettingControlProps) => {
  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium">{label}</span>
          {tooltipText && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">{tooltipText}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="font-semibold text-sm bg-accent/30 px-2 py-0.5 rounded">
          {value}
          {unit}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-7 bg-background/80"
          disabled={disabled}
          onClick={onDecrease}
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-7 bg-background/80"
          disabled={disabled}
          onClick={onIncrease}
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

const CloseSetting = () => {
  const { config, updateConfig, isLoading } = useTradingConfig();

  return (
    <div className="w-full space-y-2">
      <div className="w-full flex items-center gap-2">
        <Switch
          id="partial-close"
          checked={config?.partialClose}
          onCheckedChange={(partialClose) => {
            updateConfig({ partialClose });
          }}
          disabled={isLoading}
        />
        <Label
          htmlFor="partial-close"
          className="text-sm font-medium cursor-pointer"
        >
          부분 청산
        </Label>
      </div>

      {config?.partialClose && (
        <SettingControl
          label="청산 비율"
          value={config.closeRatio}
          unit="%"
          disabled={isLoading}
          onDecrease={() => {
            const closeRatio = config?.closeRatio
              ? config.closeRatio - 5 < 5
                ? 5
                : config.closeRatio - 5
              : 50;
            updateConfig({ closeRatio });
          }}
          onIncrease={() => {
            const closeRatio = config?.closeRatio
              ? config.closeRatio + 5 > 100
                ? 100
                : config.closeRatio + 5
              : 50;
            updateConfig({ closeRatio });
          }}
          tooltipText="목표가 도달 시 포지션을 부분적으로 청산할 비율"
        />
      )}
    </div>
  );
};

const TradingSetting = () => {
  const { config, isLoading, updateConfig } = useTradingConfig();

  return (
    <SettingControl
      label="손익비"
      value={config?.riskRatio ?? 1.5}
      unit=" : 1"
      disabled={isLoading}
      onDecrease={() => {
        const riskRatio = config?.riskRatio
          ? config.riskRatio - 0.5 < 0.5
            ? 0.5
            : config.riskRatio - 0.5
          : 1.5;
        updateConfig({ riskRatio });
      }}
      onIncrease={() => {
        const riskRatio = config?.riskRatio
          ? config.riskRatio + 0.5 > 5
            ? 5
            : config.riskRatio + 0.5
          : 1.5;
        updateConfig({ riskRatio });
      }}
      tooltipText="손절 거리 대비 목표가 거리의 비율입니다. 예: 2:1은 손절 거리의 2배를 목표가로 설정합니다."
    />
  );
};

const RiskSetting = () => {
  const { config, updateConfig, isLoading } = useTradingConfig();

  return (
    <SettingControl
      label="리스크 비율"
      value={config?.risk ?? 1.5}
      unit="%"
      disabled={isLoading}
      onDecrease={() => {
        const risk = config?.risk
          ? config.risk - 0.5 < 0.5
            ? 0.5
            : config.risk - 0.5
          : 1.5;
        updateConfig({ risk });
      }}
      onIncrease={() => {
        const risk = config?.risk
          ? config.risk + 0.5 > 5
            ? 5
            : config.risk + 0.5
          : 1.5;
        updateConfig({ risk });
      }}
      tooltipText="한 번의 거래에서 감수할 수 있는 자본의 최대 손실 비율입니다."
    />
  );
};
