import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAccounts } from "@/contexts/accounts/use";
import { useTradingConfig } from "@/contexts/settings/use";
import { useTrade } from "@/contexts/trade/use";
import { ExchangeType } from "@/lib/accounts";
import { ChevronUp, ChevronDown } from "lucide-react";
import React from "react";
import { useSearchParams } from "react-router";
import { useTradeMutation } from "@/hooks/use-trade-mutation";
import { PositionInfo } from "@/lib/trade";

export const TradingAction = () => {
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

  const handleTrade = async (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
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
    const tradeType = event.currentTarget.value as "long" | "short";
    const info = tradeInfo[tradeType] as PositionInfo;

    if (!info.position) return;

    try {
      await tradeMutation.mutateAsync({
        ccxtInstance,
        symbol,
        tradeType,
        exchange,
        info,
        config,
      });
    } catch (error) {
      console.error("Trade execution failed:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-between h-full w-full rounded-md border-opacity-50 p-2">
      {/* 설정 영역 */}
      <div className="w-full mb-2">
        <div className="w-full text-sm font-medium text-muted-foreground mb-2 border-b pb-1">
          Trading Settings
        </div>
        <div className="space-y-3">
          <CloseSetting />
          <RiskSetting />
          <TradingSetting />
        </div>
      </div>
      
      {/* 트레이딩 버튼 영역 */}
      <div className="w-full mt-auto grid grid-cols-2 gap-2">
        <Button
          value={"long"}
          variant={"long"}
          className="py-2 md:py-3 text-base font-bold shadow-md hover:shadow-lg transition-all"
          disabled={!accountInfo || tradeMutation.isPending}
          onClick={handleTrade}
        >
          {tradeMutation.isPending ? "처리중..." : "LONG"}
        </Button>
        <Button
          value={"short"}
          variant={"short"}
          className="py-2 md:py-3 text-base font-bold shadow-md hover:shadow-lg transition-all"
          disabled={!accountInfo || tradeMutation.isPending}
          onClick={handleTrade}
        >
          {tradeMutation.isPending ? "처리중..." : "SHORT"}
        </Button>
      </div>
    </div>
  );
};

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
}: SettingControlProps) => {
  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium">{label}</span>
        <div className="font-semibold text-sm bg-accent/30 px-2 py-0.5 rounded">
          {value}{unit}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-7"
          disabled={disabled}
          onClick={onDecrease}
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-7"
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
        <Label htmlFor="partial-close" className="text-sm font-medium cursor-pointer">
          Partial Close
        </Label>
      </div>
      
      {config?.partialClose && (
        <SettingControl
          label="Close Ratio"
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
          tooltipText="포지션 부분 종료 비율"
        />
      )}
    </div>
  );
};

const TradingSetting = () => {
  const { config, isLoading, updateConfig } = useTradingConfig();

  return (
    <SettingControl
      label="Risk Reward Ratio"
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
    />
  );
};

const RiskSetting = () => {
  const { config, updateConfig, isLoading } = useTradingConfig();

  return (
    <SettingControl
      label="Risk Percentage"
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
    />
  );
};