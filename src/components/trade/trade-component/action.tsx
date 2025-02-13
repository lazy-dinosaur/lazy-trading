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
    <div className="flex w-1/3 min-w-32 max-w-64 flex-col items-center justify-between h-full px-1 h-lg:px-1.5 h-xl:px-2">
      <div className="flex-1 space-y-1 h-lg:space-y-2 h-xl:space-y-3">
        <div className="w-full text-sm text-muted-foreground capitalize">
          Setting
        </div>
        <CloseSetting />
        <RiskSetting />
        <TradingSetting />
      </div>
      <div className="flex-none flex flex-col w-full gap-1 h-lg:gap-1.5 h-xl:gap-2">
        <Button
          value={"long"}
          variant={"long"}
          className="h-6 h-lg:h-7 h-xl:h-8 opacity-90"
          disabled={!accountInfo || tradeMutation.isPending}
          onClick={handleTrade}
        >
          {tradeMutation.isPending ? "처리중..." : "LONG"}
        </Button>
        <Button
          value={"short"}
          variant={"short"}
          className="h-6 h-lg:h-7 h-xl:h-8 opacity-90"
          disabled={!accountInfo || tradeMutation.isPending}
          onClick={handleTrade}
        >
          {tradeMutation.isPending ? "처리중..." : "SHORT"}
        </Button>
      </div>
    </div>
  );
};

const CloseSetting = () => {
  const { config, updateConfig, isLoading } = useTradingConfig();

  return (
    <>
      <div className="w-full px-2 flex items-center gap-2 justify-center">
        <Switch
          id="partial-close"
          checked={config?.partialClose}
          onCheckedChange={(partialClose) => {
            updateConfig({ partialClose });
          }}
          disabled={isLoading}
        />
        <Label htmlFor="partial-close" className="text-sm">
          Partial Close
        </Label>
      </div>
      {config?.partialClose && (
        <>
          <div className="flex w-full items-center justify-between px-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 h-lg:h-5 h-lg:w-5 h-xl:h-6 h-xl:w-6 hover:bg-accent border"
              onClick={() => {
                const closeRatio = config?.closeRatio
                  ? config.closeRatio - 5 < 5
                    ? 5
                    : config.closeRatio - 5
                  : 50;
                updateConfig({ closeRatio });
              }}
            >
              <ChevronDown className="h-2 w-2 h-lg:h-3 h-lg:w-3 h-xl:h-4 h-xl:w-4" />
            </Button>
            <div className="flex flex-col items-center">
              <span className="text-xs text-muted-foreground">C/R</span>
              <span className="text-sm font-semibold">
                {config.closeRatio} %
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 h-lg:h-5 h-lg:w-5 h-xl:h-6 h-xl:w-6 hover:bg-accent border"
              onClick={() => {
                const closeRatio = config?.closeRatio
                  ? config.closeRatio + 5 > 100
                    ? 100
                    : config.closeRatio + 5
                  : 50;
                updateConfig({ closeRatio });
              }}
            >
              <ChevronUp className="h-2 w-2 h-lg:h-3 h-lg:w-3 h-xl:h-4 h-xl:w-4" />
            </Button>
          </div>
        </>
      )}
    </>
  );
};
const TradingSetting = () => {
  const { config, isLoading, updateConfig } = useTradingConfig();

  return (
    <div className="flex w-full items-center justify-between px-2">
      <Button
        variant="ghost"
        size="icon"
        className="h-4 w-4 h-lg:h-5 h-lg:w-5 h-xl:h-6 h-xl:w-6 hover:bg-accent border"
        disabled={isLoading}
        onClick={() => {
          const riskRatio = config?.riskRatio
            ? config.riskRatio - 0.5 < 0.5
              ? 0.5
              : config.riskRatio - 0.5
            : 1.5;
          updateConfig({ riskRatio });
        }}
      >
        <ChevronDown className="h-2 w-2 h-lg:h-3 h-lg:w-3 h-xl:h-4 h-xl:w-4" />
      </Button>
      <div className="flex flex-col items-center">
        <span className="text-xs text-muted-foreground">R/R</span>
        <span className="text-sm font-semibold">{config?.riskRatio} : 1</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-4 w-4 h-lg:h-5 h-lg:w-5 h-xl:h-6 h-xl:w-6 hover:bg-accent border"
        disabled={isLoading}
        onClick={() => {
          const riskRatio = config?.riskRatio
            ? config.riskRatio + 0.5 > 5
              ? 5
              : config.riskRatio + 0.5
            : 1.5;
          updateConfig({ riskRatio });
        }}
      >
        <ChevronUp className="h-2 w-2 h-lg:h-3 h-lg:w-3 h-xl:h-4 h-xl:w-4" />
      </Button>
    </div>
  );
};

const RiskSetting = () => {
  const { config, updateConfig, isLoading } = useTradingConfig();

  return (
    <div className="flex w-full items-center justify-between px-2">
      <Button
        variant="ghost"
        size="icon"
        className="h-4 w-4 h-lg:h-5 h-lg:w-5 h-xl:h-6 h-xl:w-6 hover:bg-accent border"
        disabled={isLoading}
        onClick={() => {
          const risk = config?.risk
            ? config.risk - 0.5 < 0.5
              ? 0.5
              : config.risk - 0.5
            : 1.5;
          updateConfig({ risk });
        }}
      >
        <ChevronDown className="h-2 w-2 h-lg:h-3 h-lg:w-3 h-xl:h-4 h-xl:w-4" />
      </Button>
      <div className="flex flex-col items-center">
        <span className="text-xs text-muted-foreground">Risk</span>
        <span className="text-sm font-semibold">{config?.risk}%</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-4 w-4 h-lg:h-5 h-lg:w-5 h-xl:h-6 h-xl:w-6 hover:bg-accent border"
        disabled={isLoading}
        onClick={() => {
          const risk = config?.risk
            ? config.risk + 0.5 > 5
              ? 5
              : config.risk + 0.5
            : 1.5;
          updateConfig({ risk });
        }}
      >
        <ChevronUp className="h-2 w-2 h-lg:h-3 h-lg:w-3 h-xl:h-4 h-xl:w-4" />
      </Button>
    </div>
  );
};
