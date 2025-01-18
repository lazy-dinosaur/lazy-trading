// import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Button } from "../ui/button";
// import { getTradingConfig, setTradingConfig } from "@/lib/appStorage";
import { ChevronUp, ChevronDown } from "lucide-react";
import { AccountInfo, AccountInfoType } from "@/hooks/useAccountsInfo";
import {
  useFetchTradingConfig,
  useMutateTradingConfig,
} from "@/hooks/settings";
import { useParams } from "react-router";
import { useTradingFees } from "@/hooks/chart";
import { ExchangeType } from "@/hooks/useAccounts";
import { useEffect } from "react";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";

export const TradeComponent = ({
  id,
  accountsInfo,
}: {
  id?: string;
  accountsInfo?: AccountInfoType;
}) => {
  return (
    <div className="w-full h-full flex-1 flex flex-col space-y-3">
      <div className="flex w-full min-h-max items-center justify-between gap-3">
        <TradeInfo
          accountsInfo={accountsInfo && !!id ? accountsInfo[id] : undefined}
        />
        <TradingAction />
      </div>
      <div className=" w-full h-full flex">ddd</div>
    </div>
  );
};

const TradingAction = () => {
  return (
    <div className="flex w-1/3 min-w-32 max-w-64 flex-col items-center justify-between h-full space-y-3">
      <div className="w-full text-sm text-muted-foreground capitalize">
        Setting
      </div>
      <CloseSetting />
      <RiskSetting />
      <TradingSetting />
      <div className="flex flex-col w-full gap-2">
        <Button variant={"long"} className="opacity-90">
          LONG
        </Button>
        <Button variant={"short"} className="opacity-90">
          SHORT
        </Button>
      </div>
    </div>
  );
};

const CloseSetting = () => {
  const { data: tradingConfig } = useFetchTradingConfig();
  const { mutate: setTradingConfig, isPending } = useMutateTradingConfig();

  return (
    <>
      <div className="w-full px-2 flex items-center gap-2 justify-center">
        <Switch
          id="partial-close"
          checked={tradingConfig?.partialClose}
          onCheckedChange={(partialClose) => {
            setTradingConfig({ partialClose });
          }}
          disabled={isPending}
        />
        <Label htmlFor="partial-close" className="text-sm">
          Partial Close
        </Label>
      </div>
      {tradingConfig?.partialClose && (
        <>
          <div className="w-full px-2 flex items-center gap-2 justify-center">
            <Switch
              id="stop-to-even"
              checked={tradingConfig?.stopToEven}
              onCheckedChange={(stopToEven) => {
                setTradingConfig({ stopToEven });
              }}
              disabled={isPending}
            />
            <Label htmlFor="stop-to-even" className="text-sm">
              Stop To Even
            </Label>
          </div>
          <div className="flex w-full items-center justify-center">
            <span className="flex h-full w-full items-center justify-center flex-col">
              <span className="text-xs text-muted-foreground">C/R</span>
              <span className="text-sm font-semibold">
                {tradingConfig.closeRatio} %
              </span>
            </span>
            <span className="flex w-full items-center justify-center gap-1 flex-col text-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-accent border"
                // disabled={isPending}
                onClick={() => {
                  const closeRatio = tradingConfig?.closeRatio
                    ? tradingConfig.closeRatio + 5 > 100
                      ? 100
                      : tradingConfig.closeRatio + 5
                    : 50;
                  setTradingConfig({ closeRatio });
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
                  const closeRatio = tradingConfig?.closeRatio
                    ? tradingConfig.closeRatio - 5 < 5
                      ? 5
                      : tradingConfig.closeRatio - 5
                    : 50;
                  setTradingConfig({ closeRatio });
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

const TradeInfo = ({ accountsInfo }: { accountsInfo?: AccountInfo }) => {
  const assets = accountsInfo?.balance;
  const { exchange, coin, base } = useParams();
  const baseAsset = base?.split(":")[1];
  const baseAssetInfo = baseAsset && assets && assets?.[baseAsset];
  const total = assets?.usd.total;
  const used = assets?.usd.used;
  const free = assets?.usd.free;
  const { data: tradingfee, isLoading: isTradingfeeLoading } = useTradingFees(
    exchange! as ExchangeType,
    `${coin}/${base}`,
  );

  useEffect(() => {
    console.log(tradingfee);
  }, [isTradingfeeLoading, tradingfee]);

  return (
    <div className="h-full w-full flex flex-col items-center justify-between gap-2">
      <div className="w-full text-sm text-muted-foreground capitalize px-2">
        TradeInfo
      </div>
      <div className="w-full h-full rounded-md border p-2">
        {accountsInfo ? (
          <>
            <div className="text-xs text-muted-foreground mb-1">TradeInfo</div>
            <div className="capitalize text-muted-foreground">StopLossHigh</div>
            <div className="capitalize text-muted-foreground">StopLossLow</div>
          </>
        ) : (
          <>
            <div className="">스켈레톤 로딩 예정</div>
          </>
        )}
      </div>
      <span className="grid grid-cols-7 grid-rows-3 w-full border rounded-md p-2">
        <span className="text-xs text-muted-foreground capitalize">
          balance
        </span>
        <span className="text-xs text-muted-foreground capitalize col-span-2">
          total
        </span>
        <span className="text-xs text-muted-foreground capitalize col-span-2">
          free
        </span>
        <span className="text-xs text-muted-foreground capitalize col-span-2">
          used
        </span>
        <span className="text-xs text-muted-foreground capitalize ">
          {baseAsset}
        </span>
        <span className="text-sm capitalize col-span-2">
          {baseAssetInfo ? baseAssetInfo.total : 0}
        </span>
        <span className="text-sm capitalize col-span-2">
          {baseAssetInfo ? baseAssetInfo.free : 0}
        </span>
        <span className="text-sm capitalize col-span-2">
          {baseAssetInfo ? baseAssetInfo.used : 0}
        </span>
        <span className="text-xs text-muted-foreground capitalize">Usd</span>
        <span className="text-sm capitalize col-span-2">
          {total ? total : 0}
        </span>
        <span className="text-sm capitalize col-span-2">
          {used ? total : 0}
        </span>
        <span className="text-sm capitalize col-span-2">
          {free ? total : 0}
        </span>
      </span>
    </div>
  );
};

const TradingSetting = () => {
  const { data: tradingConfig } = useFetchTradingConfig();
  const { mutate: setTradingConfig, isPending } = useMutateTradingConfig();

  return (
    <div className="flex w-full items-center justify-center">
      <span className="flex h-full w-full items-center justify-center flex-col">
        <span className="text-xs text-muted-foreground">R/R</span>
        <span className="text-sm font-semibold">
          {tradingConfig?.riskRatio} : 1
        </span>
      </span>
      <span className="flex w-full items-center justify-center gap-1 flex-col text-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-accent border"
          disabled={isPending}
          onClick={() => {
            const riskRatio = tradingConfig?.riskRatio
              ? tradingConfig.riskRatio + 0.5 > 5
                ? 5
                : tradingConfig.riskRatio + 0.5
              : 1.5;
            setTradingConfig({ riskRatio });
          }}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-accent border"
          disabled={isPending}
          onClick={() => {
            const riskRatio = tradingConfig?.riskRatio
              ? tradingConfig.riskRatio - 0.5 < 0.5
                ? 0.5
                : tradingConfig.riskRatio - 0.5
              : 1.5;
            setTradingConfig({ riskRatio });
          }}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </span>
    </div>
  );
};

const RiskSetting = () => {
  const { data: tradingConfig } = useFetchTradingConfig();
  const { mutate: setTradingConfig, isPending } = useMutateTradingConfig();

  return (
    <div className="flex w-full items-center justify-center">
      <span className="flex h-full w-full items-center justify-center flex-col">
        <span className="text-xs text-muted-foreground">Risk</span>
        <span className="text-sm font-semibold">{tradingConfig?.risk}%</span>
      </span>
      <span className="flex w-full items-center justify-center gap-1 flex-col text-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-accent border"
          disabled={isPending}
          onClick={() => {
            const risk = tradingConfig?.risk
              ? tradingConfig.risk + 0.5 > 5
                ? 5
                : tradingConfig.risk + 0.5
              : 1.5;
            setTradingConfig({ risk });
          }}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-accent border"
          disabled={isPending}
          onClick={() => {
            const risk = tradingConfig?.risk
              ? tradingConfig.risk - 0.5 < 0.5
                ? 0.5
                : tradingConfig.risk - 0.5
              : 1.5;
            setTradingConfig({ risk });
          }}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </span>
    </div>
  );
};
