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

export const TradingAction = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const exchange = searchParams.get("exchange") as ExchangeType;
  const symbol = searchParams.get("symbol");
  const { accountsDetails, decryptedAccounts } = useAccounts();
  const { tradeInfo } = useTrade();
  const accountInfo = !!(id && accountsDetails) && accountsDetails[id];
  const account = !!(id && decryptedAccounts) && decryptedAccounts[id];
  const { config } = useTradingConfig();

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

    const ccxtInstance = account.exchangeInstance.pro;
    const tradeType = event.currentTarget.value as "long" | "short";
    console.log(tradeType);
    const isusdt = symbol.split(":")[1] == "USDT";
    const positionIdx = isusdt ? (tradeType == "long" ? 1 : 2) : 0;
    const side = tradeType == "long" ? "buy" : "sell";
    const info = tradeInfo[tradeType];
    if (!info.position) return;

    try {
      await ccxtInstance.setLeverage(tradeInfo.maxLeverage, symbol);
    } catch (error) {
      console.log(error);
    }
    try {
      await ccxtInstance.setMarginMode("cross");
    } catch (error) {
      console.log(error);
    }
    try {
      const order = await ccxtInstance.createOrder(
        symbol,
        "market",
        side,
        info.position.size,
        undefined,
        {
          positionIdx,
          stopLoss: {
            triggerPrice: tradeInfo.long.stoploss.price,
          },
        },
      );
      console.log(order);
      const target = await ccxtInstance.createOrder(
        symbol,
        "limit",
        "sell",
        config.partialClose
          ? info.position.size * (config.closeRatio / 100)
          : info.position.size,
        info.target.price,
        {
          positionIdx,
          reduceOnly: true,
        },
      );
      console.log(target);
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <div className="flex w-1/3 min-w-32 max-w-64 flex-col items-center justify-between h-full space-y-3">
      <div className="w-full text-sm text-muted-foreground capitalize">
        Setting
      </div>
      <CloseSetting />
      <RiskSetting />
      <TradingSetting />
      <div className="flex flex-col w-full gap-2">
        <Button
          value={"long"}
          variant={"long"}
          className="opacity-90"
          disabled={!accountInfo}
          onClick={handleTrade}
        >
          LONG
        </Button>
        <Button
          value={"short"}
          variant={"short"}
          className="opacity-90"
          disabled={!accountInfo}
          onClick={handleTrade}
        >
          SHORT
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
          <div className="flex w-full items-center justify-center">
            <span className="flex h-full w-full items-center justify-center flex-col">
              <span className="text-xs text-muted-foreground">C/R</span>
              <span className="text-sm font-semibold">
                {config.closeRatio} %
              </span>
            </span>
            <span className="flex w-full items-center justify-center gap-1 flex-col text-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-accent border"
                // disabled={isPending}
                onClick={() => {
                  const closeRatio = config?.closeRatio
                    ? config.closeRatio + 5 > 100
                      ? 100
                      : config.closeRatio + 5
                    : 50;
                  updateConfig({ closeRatio });
                }}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-accent border"
                // disabled={isPending}
                onClick={() => {
                  const closeRatio = config?.closeRatio
                    ? config.closeRatio - 5 < 5
                      ? 5
                      : config.closeRatio - 5
                    : 50;
                  updateConfig({ closeRatio });
                }}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </span>
          </div>
        </>
      )}
    </>
  );
};
const TradingSetting = () => {
  const { config, isLoading, updateConfig } = useTradingConfig();

  return (
    <div className="flex w-full items-center justify-center">
      <span className="flex h-full w-full items-center justify-center flex-col">
        <span className="text-xs text-muted-foreground">R/R</span>
        <span className="text-sm font-semibold">{config?.riskRatio} : 1</span>
      </span>
      <span className="flex w-full items-center justify-center gap-1 flex-col text-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-accent border"
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
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-accent border"
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
          <ChevronDown className="h-4 w-4" />
        </Button>
      </span>
    </div>
  );
};

const RiskSetting = () => {
  const { config, updateConfig, isLoading } = useTradingConfig();

  return (
    <div className="flex w-full items-center justify-center">
      <span className="flex h-full w-full items-center justify-center flex-col">
        <span className="text-xs text-muted-foreground">Risk</span>
        <span className="text-sm font-semibold">{config?.risk}%</span>
      </span>
      <span className="flex w-full items-center justify-center gap-1 flex-col text-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-accent border"
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
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-accent border"
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
          <ChevronDown className="h-4 w-4" />
        </Button>
      </span>
    </div>
  );
};
